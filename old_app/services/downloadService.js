/**
 * Manages feeds' XML downloads.
 */

'use strict';

function downloadService(net, feedParser, config, feedsService, articlesService, feedsWaitingRoom) {
    
    var Q = require('q');
    
    var isWorking = false;
    
    //-----------------------------------------------------
    // Helper functions
    //-----------------------------------------------------
    
    function daysToMs(days) {
        return days * 24 * 60 * 60 * 1000;
    }
    
    /**
     * Determines which feeds are active enough to be downloaded in main download job (HI basket).
     * The rest will be downloaded in background (LO basket).
     */
    function getActivityBaskets() {
        var hi = [];
        var lo = [];
        
        var now = Date.now();
        var lastDownload = config.lastFeedsDownload;
        
        // if lastDownload was more than 3 days ago we want to download everything as hi basket
        // because if someone launches the app every 3 days or less often he/she can see the article 6 days after its publication
        if (now - lastDownload > daysToMs(3)) {
            lastDownload = 0;
        }
        
        // force lastDownload to be at least 24 hours ago even if it was 1 minute ago
        if (now - lastDownload < daysToMs(1)) {
            lastDownload = now - daysToMs(1);
        }
        
        var hoursSinceLast = (now - lastDownload) / (60 * 60 * 1000);
        
        feedsService.feeds.forEach(function (feed) {
            // if probability that there is something new on this feed is greater than 33%
            // put it into hi basket, otherwise into lo
            var feedAverageActivity = feed.averageActivity || 0;
            if (hoursSinceLast >= feedAverageActivity * 0.33) {
                hi.push(feed.url);
            } else {
                lo.push(feed.url);
            }
        });
        
        // if hi basket is empty switch lo as hi
        if (hi.length === 0) {
            hi = lo;
            lo = [];
        }
        
        return {
            hi: hi,
            lo: lo
        };
    }
    
    /**
     * Returns average time gap (in hours) between most recent articles publications.
     */
    function calculateAverageActivity(articles) {
        var index = 0;
        // count gap for 5 latest articles, or less if list not that long
        var endIndex = Math.min(5, articles.length);
        // now as the reference point to first article
        var prev = Date.now();
        var gaps = [];
        
        while (index < endIndex) {
            if (!articles[index].pubDate) {
                // if feed doesn't specify pubDate of rticles assume super active 
                return 0;
            }
            var curr = articles[index].pubDate.getTime();
            gaps.push(prev - curr);
            prev = curr;
            index += 1;
        }
        
        if (gaps.length === 0) {
            return 0;
        }
        var sum = gaps.reduce(function(a, b) { return a + b }, 0);
        // average in miliseconds
        var avg = sum / gaps.length;
        
        // avarage in hours
        return Math.round(avg / (1000 * 60 * 60));
    }
    
    function fetchFeeds(feedUrls) {
        var deferred = Q.defer();
        var completed = 0;
        var total = feedUrls.length;
        var simultaneousTasks = 5;
        var workingTasks = 0;
        var timeoutsInARow = 0;
        
        function notify(url, status) {
            
            workingTasks -= 1;
            completed += 1;
            
            if (timeoutsInARow >= 5 || timeoutsInARow === total) {
                deferred.reject('No connection');
                return;
            }
            
            deferred.notify({
                completed: completed,
                total: total,
                url: url,
                status: status
            });
            
            if (completed < total) {
                next();
            } else {
                deferred.resolve();
            }
        }
        
        function fetch(url) {
            
            workingTasks += 1;
            
            net.getUrl(url, { timeout: 10000 }).then(function (buff) {
                
                timeoutsInARow = 0;
                
                parseFeed(url, buff).then(function () {
                    notify(url, 'ok');
                }, function () {
                    notify(url, 'parseError');
                });
                
            }, function (err) {
                switch (err.code) {
                    case '404':
                        notify(url, '404');
                        break;
                    //case 'ENOTFOUND': 
                    //case 'ECONNREFUSED':
                    //case 'ETIMEDOUT':
                    //case 'ESOCKETTIMEDOUT':
                    default:
                        timeoutsInARow += 1;
                        notify(url, 'connectionError');
                        break;
                }
            });
        }
        
        function next() {
            if (feedUrls.length > 0) {
                fetch(feedUrls.pop());
                if (workingTasks < simultaneousTasks) {
                    next();
                }
            }
        }
        
        if (feedUrls.length === 0) {
            deferred.resolve();
        } else {
            next();
        }
        
        return deferred.promise;
    }
    
    function fetchFeedsBackground(feedUrls) {
        var deferred = Q.defer();
        var completed = 0;
        var total = feedUrls.length;
        var simultaneousTasks = 3;
        var workingTasks = 0;
        
        function notify() {
            workingTasks -= 1;
            completed += 1;
            if (completed < total) {
                next();
            } else {
                deferred.resolve();
            }
        }
        
        function fetch(url) {
            workingTasks += 1;
            net.getUrl(url)
            .then(function (buff) {
                feedsWaitingRoom.storeOne(url, buff)
                .then(notify);
            }, notify);
            
        }
        
        function next() {
            if (feedUrls.length > 0) {
                fetch(feedUrls.pop());
                if (workingTasks < simultaneousTasks) {
                    next();
                }
            }
        }
        
        if (feedUrls.length === 0) {
            deferred.resolve();
        } else {
            next();
        }
        
        return deferred.promise;
    }
    
    function parseFeed(url, feedBuff) {
        var def = Q.defer();
        
        feedParser.parse(feedBuff)
        .then(function (result) {
            feedsService.digestFeedMeta(url, result.meta);
            var feed = feedsService.getFeedByUrl(url);
            if (feed) {
                feed.averageActivity = calculateAverageActivity(result.articles);
            }
            return articlesService.digest(url, result.articles);
        }, def.reject)
        .finally(def.resolve);
        
        return def.promise;
    }
    
    function parseWaitingRoom() {
        var def = Q.defer();
        
        function tick() {
            feedsWaitingRoom.getOne()
            .then(function (result) {
                parseFeed(result.url, result.data).then(tick, tick);
            }, def.resolve);
            // resolve on error, because waiting room returns error when has no feeds left
        }
        
        tick();
        
        return def.promise;
    }
    
    //-----------------------------------------------------
    // API methods
    //-----------------------------------------------------
    
    function download() {
        var deferred = Q.defer();
        var baskets = getActivityBaskets();
        
        console.log('Baskets to download ->');
        console.log('HI: ' + baskets.hi.length);
        console.log('LO: ' + baskets.lo.length);
        
        isWorking = true;
        
        config.lastFeedsDownload = Date.now();
        
        var parseWaitingPromise = parseWaitingRoom();
        
        var downloadPromise = fetchFeeds(baskets.hi);
        
        downloadPromise.then(null,
        function (message) {
            isWorking = false;
            deferred.reject(message);
        },
        function (progress) {
            if (progress.status === 'connectionError') {
                // if timeout occured try to download again with lo basket,
                // which is more timeout friendly
                console.log('TIMEOUT: ' + progress.url);
                baskets.lo.push(progress.url);
            }
            deferred.notify(progress);
        });
        
        Q.all([ parseWaitingPromise, downloadPromise ])
        .then(function () {
            // after main job start lo basket in background
            isWorking = false;
            deferred.resolve({
                backgroundJob: fetchFeedsBackground(baskets.lo)
            });
        });
        
        return deferred.promise;
    }
    
    return  {
        download: download,
        get isWorking() {
            return isWorking;
        },
        
        // exposed only for testing
        calculateAverageActivity: calculateAverageActivity,
        getActivityBaskets: getActivityBaskets
    };
}