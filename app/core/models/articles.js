var Nedb = require('nedb');
var scatteredStore = require('scattered-store');
var _ = require('underscore');
var Q = require('q');
var pathUtil = require('path');
var assert = require('assert');

export default function (feeds) {

    var mainDb;
    var metadataDb; // Used as index for fast querying

    var init = function (userDataStorageDir) {
        var deferred = Q.defer();

        var mainStorePath = pathUtil.resolve(userDataStorageDir, 'articles');
        var metadataPath = pathUtil.resolve(userDataStorageDir, 'articles_metadata.db');

        metadataDb = new Nedb({ filename: metadataPath });
        metadataDb.loadDatabase(function (err) {
            if (!err) {
                mainDb = scatteredStore.create(mainStorePath, function (err) {
                    if (!err) {
                        deferred.resolve();
                    }
                });
            }
        });

        return deferred.promise;
    };

    var decorateArticle = function (articleData) {
        return {
            get guid() { return articleData.guid || articleData.url; },
            get url() { return articleData.url; },
            get pubDate() { return articleData.pubDate; },
            get feed() { return feeds.getFeedById(articleData.feedId); },
            get title() { return articleData.title; },
            get body() { return articleData.body; },
            get tags() { return articleData.tags || []; },
            get enclosures() { return articleData.enclosures || []; },
        };
    };

    var store = function (articleData) {
        var deferred = Q.defer();

        // Required fields
        assert(articleData.pubDate);
        assert(articleData.feedId);
        assert(articleData.title);

        var id;
        if (articleData.guid) {
            id = articleData.guid;
        } else if (articleData.url) {
            id = articleData.url;
        } else {
            throw new Error('OMG! This article has no url or guid!');
        }

        // Assume for safety this article already has been stored.
        mainDb.get(id).then(function (art) {
            // But maybe it is not stored yet.
            art = art || {};

            _.extend(art, articleData);

            mainDb.set(id, art).then(function () {
                // Allright, main article saved, now update metadata.

                var meta = {
                    _id: id,
                    url: art.url,
                    pubDate: art.pubDate,
                    feedId: art.feedId,
                    tags: art.tags,
                };

                metadataDb.update({ _id: id }, meta, { upsert: true }, function (err) {
                    if (!err) {
                        deferred.resolve();
                    }
                });
            });
        });

        return deferred.promise;
    };

    var query = function (queryObj, startIndex, limit) {
        var deferred = Q.defer();

        var cursor = metadataDb.find(queryObj).sort({ pubDate: 1 });
        if (typeof startIndex === 'number') {
            cursor.skip(startIndex);
        }
        if (typeof limit === 'number') {
            cursor.limit(limit);
        }
        cursor.exec(function (err, artsMeta) {
            if (!err) {
                var ids = _.pluck(artsMeta, '_id');
                var articles = [];
                var stream = mainDb.getMany(ids);
                stream.on('readable', function () {
                    var art = stream.read();
                    if (art) {
                        articles.push(art.value);
                    }
                });
                stream.on('end', function () {
                    deferred.resolve(articles.map(decorateArticle));
                });
            }
        });

        return deferred.promise;
    };

    return {
        init: init,
        store: store,
        query: query,
    };
};
