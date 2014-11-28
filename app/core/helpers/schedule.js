// Runs things which should be repeated from time to time.

var moment = require('moment');

export default function (config, analytics) {

    var walkThroughSchedule = function () {

        var schedule = JSON.parse(localStorage.schedule || '{}');

        // Block analytics in development mode
        if (!config.developmentMode) {
            // Once every day send analytics daily hit
            if (moment().diff(schedule.lastAnalyticsDailyHit, 'days') !== 0) {
                analytics.dailyHit();
                schedule.lastAnalyticsDailyHit = moment().toDate();
            }
        }

        // Update all feeds' favicons every 7 days
        if (moment().diff(schedule.lastFaviconUpdate, 'days') > 7) {
            schedule.lastFaviconUpdate = moment().toDate();
            // TODO
        }

        // Database compaction every day
        if (moment().diff(schedule.lastDatabaseCompaction, 'days') !== 0) {
            schedule.lastDatabaseCompaction = moment().toDate();
            // TODO
        }

        // Save changed schedule after every run.
        localStorage.schedule = JSON.stringify(schedule);
    };

    var start = function () {
        // Every 30min walk through schedule
        setInterval(walkThroughSchedule, 1800000);
        // First schedule 30s after startup
        setTimeout(walkThroughSchedule, 30000);
    };

    return {
        start: start,
    };
};
