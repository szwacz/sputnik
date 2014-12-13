var Q = require('q');

export default function ($http, feedParser, feeds, articles) {

    var isWorking = false;

    var fetch = function (feed) {
        var deferred = Q.defer();

        $http.get(feed.url)
        .success(function (data) {

            feedParser.parse(new Buffer(data))
            .then(function (result) {

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
