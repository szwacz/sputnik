import articlesModel from './articles';

var jetpack = require('fs-jetpack');
var os = require('os');
var _ = require('underscore');
var moment = require('moment');

describe('articles model', function () {

    var tmpdir = os.tmpdir() + '/sputnik_unit_tests';
    var articles;

    beforeEach(module('sputnik', function($provide) {
        $provide.service('articles', articlesModel);
        $provide.service('feeds', function () {
            return {
                getFeedById: function (id) {
                    return feed1;
                }
            };
        });
    }));

    beforeEach(inject(function (_articles_) {
        articles = _articles_;
    }));

    afterEach(function() {
        jetpack.dir(tmpdir, { exists: false });
    });

    var reload = function () {
        return articles.init(tmpdir);
    };

    var feed1 = {
        id: 'feed1',
    };

    var art1 = {
        url: 'art1.com',
        feedId: feed1.id,
        pubDate: moment('2014-11-09').toDate(),
        title: 'Art1',
        body: 'Body1',
    };

    var art2 = {
        url: 'art2.com',
        feedId: feed1.id,
        pubDate: moment('2014-11-05').toDate(),
        title: 'Art2',
        body: 'Body2',
    };

    var art3 = {
        url: 'art3.com',
        feedId: feed1.id,
        pubDate: moment('2014-11-01').toDate(),
        title: 'Art3',
        body: 'Body3',
    };

    var storeAllForFeed1 = function () {
        return articles.store(art1)
        .then(function () {
            return articles.store(art2);
        })
        .then(function () {
            return articles.store(art3);
        });
    }

    it('can store an article', function (done) {
        reload()
        .then(function () {
            return articles.store(art1);
        })
        .then(reload)
        .then(function () {
            return articles.query({
                feedId: feed1.id,
            });
        })
        .then(function (articles) {
            expect(articles.length).toBe(1);
            var art = articles[0];
            expect(art.guid).toBe(art1.url); // GUID not specified, so URL becomes GUID.
            expect(art.url).toBe(art1.url);
            expect(art.feed.id).toBe(art1.feedId);
            expect(art.pubDate.getTime()).toEqual(art1.pubDate.getTime());
            expect(art.title).toBe(art1.title);
            expect(art.body).toBe(art1.body);
            expect(art.tags).toEqual([]);
            expect(art.enclosures).toEqual([]);
            done();
        });
    });

    xit("treats url as article's guid if guid not present", function (done) {
        
    });

    xit("not allows to store article without guid and url", function (done) {

    });

    xit("sets Date.now as fallback if article has no pubDate", function (done) {

    });

    it('gives articles always in chronological order, newest first', function (done) {
        reload()
        .then(function () {
            return storeAllForFeed1();
        })
        .then(function () {
            return articles.query({
                feedId: feed1.id,
            });
        })
        .then(function (articles) {
            expect(articles.length).toBe(3);
            expect(articles[0].guid).toBe(art1.url);
            expect(articles[1].guid).toBe(art2.url);
            expect(articles[2].guid).toBe(art3.url);
            done();
        });
    });

    it('can paginate query results', function (done) {
        reload()
        .then(function () {
            return storeAllForFeed1();
        })
        .then(function () {
            return articles.query({
                feedId: feed1.id,
            }, 1, 1); // <-- pagination startIndex, limit
        })
        .then(function (articles) {
            expect(articles.length).toBe(1);
            expect(articles[0].guid).toBe(art2.url);
            done();
        });
    });

});
