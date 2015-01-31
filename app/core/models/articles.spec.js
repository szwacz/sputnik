import articlesModel from './articles';

var jetpack = require('fs-jetpack');
var os = require('os');
var _ = require('underscore');
var moment = require('moment');

describe('articles model', function () {

    var tmpdir = os.tmpdir() + '/sputnik_unit_tests';
    var articles;
    var $rootScope;

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

    beforeEach(inject(function (_$rootScope_, _articles_) {
        $rootScope = _$rootScope_;
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
        url: 'http://art1.com',
        guid: 'art1.com',
        feedId: feed1.id,
        pubDate: moment('2014-11-09').toDate(),
        title: 'Art1',
        body: 'Body1',
    };

    var art2 = {
        url: 'http://art2.com',
        guid: 'art2.com',
        feedId: feed1.id,
        pubDate: moment('2014-11-05').toDate(),
        title: 'Art2',
        body: 'Body2',
    };

    var art3 = {
        url: 'http://art3.com',
        guid: 'art3.com',
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
            expect(art.guid).toBe(art1.guid);
            expect(art.url).toBe(art1.url);
            expect(art.feed.id).toBe(art1.feedId);
            expect(art.pubDate.getTime()).toEqual(art1.pubDate.getTime());
            expect(art.title).toBe(art1.title);
            expect(art.body).toBe(art1.body);
            expect(art.enclosures).toEqual([]);
            done();
        });
    });

    it('when storing same article again it overwrites the old one', function (done) {
        reload()
        .then(function () {
            return articles.store({
                url: 'http://art1.com',
                feedId: feed1.id,
                title: 'Art1',
            });
        })
        .then(function () {
            return articles.store({
                url: 'http://art1.com',
                feedId: feed1.id,
                title: 'Art1 - updated',
            });
        })
        .then(function () {
            return articles.query({
                feedId: feed1.id,
            });
        })
        .then(function (articles) {
            expect(articles.length).toBe(1);
            var art = articles[0];
            expect(art.url).toBe('http://art1.com');
            expect(art.feed.id).toBe(art1.feedId);
            expect(art.title).toBe('Art1 - updated');
            done();
        });
    });

    it('can update an article', function (done) {
        reload()
        .then(function () {
            return articles.store({
                url: 'http://art1.com',
                feedId: feed1.id,
                title: 'Art1',
            });
        })
        .then(function () {
            return articles.query({
                feedId: feed1.id,
            });
        })
        .then(function (articles) {
            var art = articles[0];
            return art.update({
                title: 'Art1 - updated',
            });
        })
        .then(function () {
            return articles.query({
                feedId: feed1.id,
            });
        })
        .then(function (articles) {
            expect(articles.length).toBe(1);
            var art = articles[0];
            expect(art.url).toBe('http://art1.com');
            expect(art.feed.id).toBe(art1.feedId);
            expect(art.title).toBe('Art1 - updated');
            done();
        });
    });

    it("treats url as article's guid if guid not present", function (done) {
        reload()
        .then(function () {
            return articles.store({
                url: 'http://art.com',
                feedId: feed1.id,
                title: 'Art',
            });
        })
        .then(function () {
            return articles.query({
                feedId: feed1.id,
            });
        })
        .then(function (articles) {
            expect(articles[0].guid).toBe('http://art.com');
            done();
        });
    });

    it("doesn't allow to store article without guid and url", function (done) {
        reload()
        .then(function () {
            try {
                articles.store({
                    feedId: feed1.id,
                    title: 'Art',
                });
            } catch (err) {
                expect(err).toBe('This article has no url or guid');
                done();
            }
        });
    });

    it("sets Date.now as fallback if article has no pubDate", function (done) {
        reload()
        .then(function () {
            articles.store({
                url: 'http://art.com',
                feedId: feed1.id,
                title: 'Art',
            });
        })
        .then(reload)
        .then(function () {
            return articles.query({
                feedId: feed1.id,
            });
        })
        .then(function (articles) {
            var pub = moment(articles[0].pubDate);
            expect(pub.diff(new Date(), 'minutes')).toBe(0);
            done();
        });
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
            expect(articles[0].guid).toBe(art1.guid);
            expect(articles[1].guid).toBe(art2.guid);
            expect(articles[2].guid).toBe(art3.guid);
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
            expect(articles[0].guid).toBe(art2.guid);
            done();
        });
    });

    it('can mark article as unread or already read', function (done) {
        reload()
        .then(function () {
            return storeAllForFeed1();
        })
        .then(function () {
            return articles.countUnread(feed1.id);
        })
        .then(function (count) {
            expect(count).toBe(3);
            return articles.query({
                feedId: feed1.id,
            });
        })
        .then(function (articles) {
            return articles[0].update({
                markedAsRead: true
            });
        })
        .then(function () {
            return articles.countUnread(feed1.id);
        })
        .then(function (count) {
            expect(count).toBe(2);
            done();
        });
    });

    describe('events', function () {

        it('emits event when article stored or updated', function (done) {
            var createdEventFired;
            var updatedEventFired;

            $rootScope.$on('articles:articleCreated', function (event, articleId, feedId) {
                createdEventFired = true;
                expect(articleId).toBeDefined();
                expect(feedId).toBe(feed1.id);
            });
            $rootScope.$on('articles:articleUpdated', function (event, articleId, feedId) {
                updatedEventFired = true;
                expect(articleId).toBeDefined();
                expect(feedId).toBe(feed1.id);
            });

            reload()
            .then(function () {
                return articles.store({
                    url: 'http://art1.com',
                    feedId: feed1.id,
                    title: 'Art1',
                });
            })
            .then(function () {
                return articles.query({
                    feedId: feed1.id,
                });
            })
            .then(function (articles) {
                return articles[0].update({
                    title: 'Art1 - updated',
                });
            })
            .then(function () {
                expect(createdEventFired).toBeTruthy();
                expect(updatedEventFired).toBeTruthy();
                done();
            });
        });

    });

});
