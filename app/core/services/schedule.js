// Runs things which should be repeated from time to time.

export default function (config, analytics, feedsService, articlesService, faviconsService) {
    
    var daysToMs = function (numDays) {
        return numDays * 24 * 60 * 60 * 1000;
    }
    
    var walkThroughSchedule = function () {
        
        var schedule = JSON.parse(localStorage.schedule || '{}');
        
        var today = new Date();
        var nowTime = Date.now();
        
        // once every day send analytics daily hit
        var todayDate = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        if (todayDate !== schedule.lastAnalyticsDailyHit) {
            analytics.dailyHit();
            schedule.lastAnalyticsDailyHit = todayDate;
        }
        
        // check for new version every 7 days
        if (!schedule.nextCheckForUpdates || schedule.nextCheckForUpdates <= nowTime) {
            schedule.nextCheckForUpdates = nowTime + daysToMs(7);
            checkForUpdates();
        }
        
        // update all feeds' favicons every 7 days
        if (!schedule.nextFaviconUpdate || schedule.nextFaviconUpdate <= nowTime) {
            faviconsService.updateMany(feedsService.feeds);
            schedule.nextFaviconUpdate = nowTime + daysToMs(7);
        }
        
        // perform database compaction every 7 days
        if (!schedule.nextDatabaseCompaction || schedule.nextDatabaseCompaction <= nowTime) {
            // assume month is 31 days
            var olderThan = nowTime - (config.keepArticlesForMonths * 31 * 24 * 60 * 60 * 1000);
            articlesService.removeOlderThan(olderThan, config.keepTaggedArticlesForever)
            .then(function (numRemoved) {
                // done
            });
            schedule.nextDatabaseCompaction = nowTime + daysToMs(3);
        }
        
        // save changed schedule after every run
        localStorage.schedule = JSON.stringify(schedule);
    };
    
    var start = function () {
        // every 30min walk through schedule
        var scheduleInterval = setInterval(walkThroughSchedule, 1800000);
        // first schedule do after 30s after startup
        setTimeout(walkThroughSchedule, 30000);
    };
    
    return {
        start: start,
    };
};