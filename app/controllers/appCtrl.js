'use strict';

function AppCtrl($scope, $location, config, feedsService, articlesService, faviconsService, updateService) {
    
    var os = require('os');
    var analytics = require('./helpers/analytics');
    var gui = require('nw.gui');
    var win = gui.Window.get();
    
    $scope.allTags = [];
    
    $scope.lastSignificantEvent = 'appJustStarted';
    
    analytics.init(config.analyticsUrl, config.guid, config.version);
    
    //-----------------------------------------------------
    // Notification bar
    //-----------------------------------------------------
    
    var notificationInterval;
    $scope.notificationBarVisible = false;
    $scope.notificationMessage = null;
    
    $scope.$on('showNotification', function (evt, message) {
        $scope.notificationMessage = message;
        $scope.notificationBarVisible = true;
        $scope.$apply();
        
        // calculate position for notification bar
        var xAxis = $('.column-one').width() + $('.column-two').width() / 2;
        var notifBar = $('.notification-bar');
        var left = xAxis - notifBar.width() / 2 - 32;
        notifBar.css('left', left);
        
        var duration = Math.max(4000, message.length * 120);
        clearInterval(notificationInterval);
        notificationInterval = setInterval(function () {
            $scope.notificationBarVisible = false;
            $scope.$apply();
        }, duration);
    });
    
    //-----------------------------------------------------
    // Model events
    //-----------------------------------------------------
    
    $scope.$on('feedAdded', function (evt, feed) {
        $scope.lastSignificantEvent = 'feedAdded';
    });
    
    $scope.$on('feedSiteUrlSpecified', function (evt, feed) {
        // is siteUrl first time specified try to get its favicon
        faviconsService.updateOne(feed);
    });
    
    $scope.$on('feedRemoved', function (evt, feed) {
        faviconsService.deleteFaviconIfHas(feed);
        // Articles for now are not deleted (seems more user friendly approach)
    });
    
    $scope.$on('feedsImported', function (evt) {
        faviconsService.updateMany(feedsService.feeds);
        $scope.lastSignificantEvent = 'feedsImported';
    });
    
    $scope.$on('tagsListChanged', function (evt) {
        $scope.allTags = articlesService.allTags;
    });
    
    $scope.$on('faviconUpdated', function (evt) {
        $scope.$apply();
    });
    
    //-----------------------------------------------------
    // App about to close
    //-----------------------------------------------------
    
    win.on('close', function () {
        this.hide(); // pretend to be closed already
        windowStateManager.save();
        this.close(true);
    });
    
    //-----------------------------------------------------
    // Open link in system default browser,
    // if has class 'js-external-link' somewhere in DOM chain.
    //-----------------------------------------------------
    
    function supportExternalLinks(event) {
        
        var href;
        var isExternal = false;
        
        function crawlDom(element) {
            if (element.nodeName.toLowerCase() === 'a') {
                href = element.getAttribute('href');
            }
            if (element.classList.contains('js-external-link')) {
                isExternal = true;
            }
            
            if (href && isExternal) {
                gui.Shell.openExternal(href);
                event.preventDefault();
            } else if (element.parentElement) {
                crawlDom(element.parentElement);
            }
        }
        
        crawlDom(event.target);
    }
    
    document.body.addEventListener('click', supportExternalLinks, false);
    
    //-----------------------------------------------------
    // Checking for new version
    //-----------------------------------------------------
    
    function checkForUpdates() {
        updateService.checkUpdates()
        .then(function (newVersion) {
            localStorage.newAppVersion = JSON.stringify({
                version: newVersion
            });
            displayNewVersionAvailable();
            $scope.$apply();
        });
    }
    
    function displayNewVersionAvailable() {
        var newAppVersion = JSON.parse(localStorage.newAppVersion || 'null');
        if (newAppVersion) {
            if (!updateService.isNewerVersion(newAppVersion.version)) {
                // app was updated to latest version, so we can erase this info
                localStorage.removeItem('newAppVersion');
            } else {
                $scope.newVersionAvailable = newAppVersion.version;
            }
        }
    }
    
    displayNewVersionAvailable();
    
    //-----------------------------------------------------
    // Schedule
    //-----------------------------------------------------
    
    function daysToMs(numDays) {
        return numDays * 24 * 60 * 60 * 1000;
    }
    
    function walkThroughSchedule() {
        
        var schedule = JSON.parse(localStorage.schedule || '{}');
        
        var today = new Date();
        var nowTime = Date.now();
        
        // once every day send analytics daily hit
        var todayDate = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        if (todayDate !== schedule.lastAnalyticsDailyHit) {
            analytics.dailyHit();
            schedule.lastAnalyticsDailyHit = todayDate;
        }
        
        // once every month send reaport about basic usage informations
        if (!schedule.nextAnalyticsMonthlyReaport) {
            // first reaport in 7 days
            schedule.nextAnalyticsMonthlyReaport = nowTime + daysToMs(7);
        } else if (schedule.nextAnalyticsMonthlyReaport <= nowTime) {
            analytics.monthlyReaport({
                feedsCount: feedsService.feeds.length,
                categoriesCount: feedsService.categoriesNames.length,
                tagsCount: articlesService.allTags.length,
                articlesDbSize: articlesService.dbSize,
                platform: config.targetPlatform + '|' + os.platform() + '|' + os.type() + '|' + os.release(),
                windowSize: win.width + 'x' + win.height
            });
            schedule.nextAnalyticsMonthlyReaport = nowTime + daysToMs(30);
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
    }
    
    // every 30min walk through schedule
    var scheduleInterval = setInterval(walkThroughSchedule, 1800000);
    // first schedule do after 1 minute from startup
    setTimeout(walkThroughSchedule, 30000);
}