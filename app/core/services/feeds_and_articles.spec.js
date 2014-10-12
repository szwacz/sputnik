import feedsStorage from '../models/feeds_storage';
import articlesStorage from '../models/articles_storage';
import feedsServiceClass from './feeds';
import articlesServiceClass from './articles';

describe('integration: feedsService and articlesService', function () {
    
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
    
    var feedsService;
    var articlesService;
    var $rootScope;
    
    beforeEach(function (done) {
        feedsStorage.make()
        .then(function (fst) {
            
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
            
            module('sputnik', function ($provide) {
                $provide.value('feedsStorage', fst);
                $provide.value('articlesStorage', articlesStorage.make());
                $provide.value('opml', {});
                $provide.value('config', {});
                $provide.service('feedsService', feedsServiceClass);
                $provide.service('articlesService', articlesServiceClass);
            });
            
            done();
        });
    });
    
    beforeEach(inject(function (_$rootScope_, _feedsService_, _articlesService_) {
        $rootScope = _$rootScope_;
        feedsService = _feedsService_;
        articlesService = _articlesService_;
    }));
    
    it('article has reference to its feed', function (done) {
        articlesService.digest('a.com/feed', harvest)
        .then(function () {
            return articlesService.getArticles('a.com/feed', 0, 1);
        })
        .then(function (result) {
            expect(result.articles[0].feed).toEqual(feedsService.feeds[0]);
            done();
        });
    });
    
    it('fires unreadArticlesRecounted event when this value calculated at startup', function (done) {
        $rootScope.$on('unreadArticlesRecounted', function (evt) {
            done();
        });
    });
    
    it('unreadArticlesCount is kept up to date after calling setIsRead', function (done) {
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
            done();
        });
    });
    
    it('unreadArticlesCount is kept up to date after calling markAllAsRead', function (done) {
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
            done();
        });
    });
    
});