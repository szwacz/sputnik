var Q = require('q');
var urlUtil = require('url');
var cheerio = require('cheerio');

export default function ($http, feedParser) {

    var findFeedUrlInHtml = function (body, url) {
        var dom = cheerio.load(body);
        var href = dom('link[type="application/rss+xml"]').attr('href');
        if (!href) {
            href = dom('link[type="application/atom+xml"]').attr('href');
        }
        if (href) {
            if (!href.match(/^http/)) {
                href = urlUtil.resolve(url, href);
            }
            return href;
        }
        return null;
    };

    var scout = function (url) {
        var deferred = Q.defer();

        if (!url.match(/^http/)) {
            url = 'http://' + url;
        }

        console.log('[FeedScout] Fetching ' + url);

        // download given url
        $http.get(url)
        .success(function (data) {
            // see if it is feed xml or something else
            feedParser.parse(new Buffer(data))
            .then(function () {
                console.log('[FeedScout] URL is RSS! (' + url + ')');
                deferred.resolve(url);
            }, function (err) {
                // if not, treat it as html and try to find rss tag inside
                var foundFeedUrl = findFeedUrlInHtml(data, url);
                console.log('[FeedScout] RSS link found in HTML: ' + foundFeedUrl);
                console.log('[FeedScout] Fetching that URL...');
                if (foundFeedUrl) {
                    // download found url, and check if it is appropriate format
                    $http.get(foundFeedUrl)
                    .success(function (data) {
                        feedParser.parse(new Buffer(data))
                        .then(function () {
                            console.log('[FeedScout] URL is RSS! (' + foundFeedUrl + ')');
                            deferred.resolve(foundFeedUrl);
                        }, function (err) {
                            console.log('[FeedScout] URL is NOT valid RSS (' + foundFeedUrl + ')');
                            console.log('[FeedScout] Data received:');
                            console.log(data);
                            deferred.reject({ code: 'noFeed' });
                        });
                    })
                    .error(function (data, status) {
                        deferred.reject({ code: status.toString() });
                    });
                } else {
                    deferred.reject({ code: 'noFeed' });
                }
            });
        })
        .error(function (data, status) {
            deferred.reject({ code: status.toString() });
        });

        return deferred.promise;
    };

    return {
        scout: scout
    };
};
