/**
 * Manages feeds' XML downloads.
 */

export default function ($http, feedParser, feedsService, articlesService) {
    
    var Q = require('q');
    
    var isWorking = false;
    
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
            
            $http.get(url)
            .success(function (data) {
                
                timeoutsInARow = 0;
                
                parseFeed(url, data)
                .then(function () {
                    notify(url, 'ok');
                }, function () {
                    notify(url, 'parseError');
                });
                
            })
            .error(function (err) {
                switch (err.code) {
                    case '404':
                        notify(url, '404');
                        break;
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
    
    function parseFeed(url, data) {
        var def = Q.defer();
        
        feedParser.parse(new Buffer(data))
        .then(function (result) {
            feedsService.digestFeedMeta(url, result.meta);
            var feed = feedsService.getFeedByUrl(url);
            return articlesService.digest(url, result.articles);
        }, def.reject)
        .finally(def.resolve);
        
        return def.promise;
    }
    
    //-----------------------------------------------------
    // API methods
    //-----------------------------------------------------
    
    function download() {
        var deferred = Q.defer();
        
        isWorking = true;
        
        var downloadPromise = fetchFeeds(feedsService.feeds.map(function (feed) {
            return feed.url;
        }));
        
        downloadPromise.then(
        function () {
            // after main job start lo basket in background
            isWorking = false;
            deferred.resolve();
        },
        function (message) {
            isWorking = false;
            deferred.reject(message);
        },
        function (progress) {
            if (progress.status === 'connectionError') {
                // if timeout occured try to download again with lo basket,
                // which is more timeout friendly
                console.log('TIMEOUT: ' + progress.url);
            }
            deferred.notify(progress);
        });
        
        return deferred.promise;
    }
    
    return  {
        download: download,
        get isWorking() {
            return isWorking;
        },
    };
}