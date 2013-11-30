'use strict';

describe('integration: feedsService and articlesService', function () {
    
    var feedsStorage = require('../app/models/feedsStorage');
    var articlesStorage = require('../app/models/articlesStorage');
    
    var harvest = [
        {
            "title": "art1",
            "description": "desc",
            "link": "link1A",
            "pubDate": new Date(1),
        },
        {
            "title": "art2",
            "description": "desc",
            "link": "link2A",
            "pubDate": new Date(2),
        }
    ];
    var harvest2 = [
        {
            "title": "art1",
            "description": "desc",
            "link": "link1B",
            "pubDate": new Date(1),
        },
        {
            "title": "art2",
            "description": "desc",
            "link": "link2B",
            "pubDate": new Date(2),
        }
    ];
    
    beforeEach(module('sputnik', function($provide) {
        var fst = feedsStorage.make();
        
        // initial data for tests
        fst.addFeed({
            url: 'a.com/feed',
            title: 'a',
            category: 'First Category',
        });
        fst.addFeed({
            url: 'b.com/feed',
            title: 'b',
        });
        
        $provide.value('feedsStorage', fst);
        $provide.value('articlesStorage', articlesStorage.make());
        $provide.value('opml', {});
        $provide.value('config', {});
    }));
    
    it('article has reference to its feed', inject(function (feedsService, articlesService) {
        var done = false;
        articlesService.digest('a.com/feed', harvest)
        .then(function () {
            return articlesService.getArticles('a.com/feed', 0, 1);
        })
        .then(function (result) {
            expect(result.articles[0].feed).toEqual(feedsService.feeds[0]);
            done = true;
        });
        waitsFor(function () { return done; }, "timeout", 500);
    }));
    
    it('fires unreadArticlesRecounted event when this value calculated at startup', inject(function ($rootScope, feedsService, articlesService) {
        var done = false;
        $rootScope.$on('unreadArticlesRecounted', function (evt) {
            done = true;
        });
        waitsFor(function () { return done; }, null, 500);
    }));
    
    it('unreadArticlesCount is kept up to date after calling setIsRead', inject(function (feedsService, articlesService) {
        var done = false;
        articlesService.digest('a.com/feed', harvest)
        .then(function () {
            return articlesService.digest('b.com/feed', harvest2);
        })
        .then(function () {
            expect(feedsService.unreadArticlesCount).toBe(4);
            expect(feedsService.tree[0].unreadArticlesCount).toBe(2);
            expect(feedsService.tree[0].feeds[0].unreadArticlesCount).toBe(2);
            expect(feedsService.tree[1].unreadArticlesCount).toBe(2);
            return articlesService.getArticles('a.com/feed', 0, 1);
        })
        .then(function (result) {
            return result.articles[0].setIsRead(true);
        })
        .then(function () {
            expect(feedsService.unreadArticlesCount).toBe(3);
            expect(feedsService.tree[0].unreadArticlesCount).toBe(1);
            expect(feedsService.tree[0].feeds[0].unreadArticlesCount).toBe(1);
            expect(feedsService.tree[1].unreadArticlesCount).toBe(2);
            done = true;
        });
        waitsFor(function () { return done; }, "timeout", 500);
    }));
    
    it('unreadArticlesCount is kept up to date after calling markAllAsRead', inject(function (feedsService, articlesService) {
        var done = false;
        articlesService.digest('a.com/feed', harvest)
        .then(function () {
            expect(feedsService.unreadArticlesCount).toBe(2);
            expect(feedsService.tree[0].unreadArticlesCount).toBe(2);
            expect(feedsService.tree[0].feeds[0].unreadArticlesCount).toBe(2);
            return articlesService.markAllAsReadInFeeds(['a.com/feed']);
        })
        .then(function () {
            expect(feedsService.unreadArticlesCount).toBe(0);
            expect(feedsService.tree[0].unreadArticlesCount).toBe(0);
            expect(feedsService.tree[0].feeds[0].unreadArticlesCount).toBe(0);
            done = true;
        });
        waitsFor(function () { return done; }, "timeout", 500);
    }));
    
});