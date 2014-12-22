var Q = require('q');
var _ = require('underscore');

export default function ($http, feedParser, feeds, articles) {

    var isWorking = false;

    var fetch = function (feed) {
        var deferred = Q.defer();

        $http.get(feed.url)
        .success(function (data) {

            feedParser.parse(new Buffer(data))
            .then(function (result) {

                // We will need guids and urls later
                var currGuids = _.pluck(result.articles, 'guid');
                var currUrls = _.pluck(result.articles, 'url');

                // Store or update all articles from XML
                var promises = result.articles.map(function (art) {
                    return articles.store({
                        feedId: feed.id,
                        guid: art.guid,
                        url: art.link,
                        pubDate: art.pubDate,
                        title: art.title,
                        body: art.description,
                        enclosures: art.enclosures,
                    });
                });

                Q.all(promises)
                .then(function () {
                    // Find old articles from this feed, and mark them as abandoned.
                    return articles.query({ feedId: feed.id, abandoned: { $ne: true } });
                })
                .then(function (result) {
                    var haveToUpdateAsAbandoned = result.filter(function (art) {
                        if (_.contains(currGuids, art.guid) ||
                            _.contains(currUrls, art.url)) {
                            // This article is still on XML so don't mark it as abandoned.
                            return false;
                        }
                        return true;
                    });
                    var promises = haveToUpdateAsAbandoned.map(function (art) {
                        return art.update({ abandoned: true });
                    });
                    return Q.all(promises);
                })
                .then(function () {
                    // Update basic data about this feed
                    return feed.update({
                        siteUrl: result.meta.link,
                        originalName: result.meta.title,
                    });
                })
                .then(deferred.resolve);
            });
        });

        return deferred.promise;
    };

    var download = function (feeds) {
        isWorking = true;
        var promises = feeds.map(fetch);
        return Q.all(promises);
    }

    return  {
        download: download,
        get isWorking() {
            return isWorking;
        },
    };
}
