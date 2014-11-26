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

        // download given url
        $http.get(url)
        .success(function (data) {
            // see if it is feed xml or something else
            feedParser.parse(new Buffer(data))
            .then(function () {
                deferred.resolve(url);
            }, function (err) {
                // if not, treat it as html and try to find rss tag inside
                var foundFeedUrl = findFeedUrlInHtml(data, url);
                if (foundFeedUrl) {
                    // download found url, and check if it is appropriate format
                    $http.get(foundFeedUrl)
                    .success(function (data) {
                        feedParser.parse(new Buffer(data))
                        .then(function () {
                            deferred.resolve(foundFeedUrl);
                        }, function (err) {
                            err.code = 'noFeed';
                            deferred.reject(err);
                        });
                    })
                    .error(function (data, status) {
                        deferred.reject({ code: status.toString() });
                    });
                } else {
                    err.code = 'noFeed';
                    deferred.reject(err);
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
