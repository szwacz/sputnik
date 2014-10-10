import opmlService from '../import_export/services/opml';
import feedsStorage from '../models/feedsStorage';
import feedsServiceClass from './feedsService';

describe('feedsService', function () {
    
    var $rootScope;
    var feedsService;
    var opml;
    
    beforeEach(function (done) {
        feedsStorage.make()
        .then(function (fst) {
            // initial data for tests
            // Ą,ą,ć chars for utf sorting test
            fst.addFeed({
                url: 'd.com/feed',
                title: 'd',
            });
            fst.addFeed({
                url: 'e.com/feed',
                title: 'e',
            });
            fst.addFeed({
                url: 'c.com/feed',
                title: 'c',
                category: 'ć Second Category',
            });
            fst.addCategory('Third Category');
            fst.addFeed({
                url: 'a.com/feed',
                title: 'ąĄ',
                category: 'ą First Category',
            });
            fst.addFeed({
                url: 'b.com/feed',
                title: 'b',
                category: 'ą First Category',
            });
            
            module('sputnik', function ($provide) {
                $provide.value('feedsStorage', fst);
                $provide.value('config', { dataHomeFolder: '/userdata' });
                $provide.service('feedsService', feedsServiceClass);
                $provide.service('opml', opmlService);
            });
            
            done();
        });
    });
    
    beforeEach(inject(function (_$rootScope_, _feedsService_, _opml_) {
        $rootScope = _$rootScope_;
        feedsService = _feedsService_;
        opml = _opml_;
    }));
    
    it('can import and export OPML', function () {
        var opml = '<?xml version="1.0" encoding="UTF-8"?>' +
            '<opml version="1.0">' +
                '<body>' +
                    '<outline text="new" type="rss" xmlUrl="http://new.com/feed" />' +
                '</body>' +
            '</opml>';
        expect(feedsService.isValidOpml).toBeDefined();
        expect(feedsService.feeds.length).toBe(5);
        feedsService.importOpml(opml);
        expect(feedsService.feeds.length).toBe(6);
        var exportedOpml = feedsService.exportOpml();
        expect(exportedOpml.length).toBeGreaterThan(0);
    });
    
    it('has sorted tree of categories and feeds', function () {
        var t = feedsService.tree;
        expect(t.length).toBe(5);
        expect(t[0].title).toBe('ą First Category');
        expect(t[0].feeds.length).toBe(2);
        expect(t[0].feeds[0].title).toBe('ąĄ');
        expect(t[0].feeds[1].title).toBe('b');
        expect(t[1].title).toBe('ć Second Category');
        expect(t[1].feeds.length).toBe(1);
        expect(t[2].title).toBe('Third Category');
        expect(t[2].feeds.length).toBe(0);
        expect(t[3].title).toBe('d');
        expect(t[4].title).toBe('e');
    });
    
    it('updates tree if feed added', function () {
        expect(feedsService.tree[5]).toBeUndefined();
        feedsService.addFeed({
            url: 'z.com/feed',
            title: 'z'
        });
        expect(feedsService.tree[5].title).toBe('z');
    });
    
    it('updates tree if category added', function () {
        expect(feedsService.tree[3].title).toBe('d');
        feedsService.addCategory('Zilch');
        expect(feedsService.tree[3].title).toBe('Zilch');
    });
    
    it('updates tree if feed category changed', function () {
        expect(feedsService.tree[4].title).toBe('e');
        feedsService.tree[4].category = 'Third Category';
        expect(feedsService.tree[2].feeds[0].title).toBe('e');
    });
    
    it('updates tree if feed removed', function () {
        expect(feedsService.tree[4].title).toBe('e');
        feedsService.tree[4].remove();
        expect(feedsService.tree[4]).toBeUndefined();
    });
    
    it('updates tree if category removed', function () {
        expect(feedsService.tree[0].title).toBe('ą First Category');
        feedsService.tree[0].remove();
        expect(feedsService.tree[0].title).toBe('ć Second Category');
    });
    
    it('implements feeds category behaviours', function () {
        expect(feedsService.unreadArticlesCount).toBe(0);
        expect(feedsService.feeds.length).toBe(5);
        expect(feedsService.title).toBe('All');
    });
    
    it('has sorted list of categories', function () {
        expect(feedsService.categoriesNames).toEqual(['ą First Category', 'ć Second Category', 'Third Category']);
    });
    
    it('can digest feeds harvest', function () {
        feedsService.digestFeedMeta('a.com/feed', {
            title: "Feed A",
            link: "a.com/new"
        });
        var feed = feedsService.getFeedByUrl('a.com/feed');
        expect(feed.title).toBe("Feed A");
        expect(feed.siteUrl).toBe("a.com/new");
    });
    
    it('has category objects', function () {
        var category = feedsService.tree[0];
        expect(category.type).toBe('category');
        expect(category.unreadArticlesCount).toBe(0);
        expect(category.setTitle).toBeDefined();
        expect(category.remove).toBeDefined();
    });
    
    it('has feed objects', function () {
        var feed = feedsService.getFeedByUrl('a.com/feed');
        expect(feed.type).toBe('feed');
        expect(feed.unreadArticlesCount).toBe(0);
        
        expect(feed.title).toBe('ąĄ');
        feed.title = 'abc';
        expect(feed.title).toBe('abc');
        
        expect(feed.siteUrl).toBeUndefined();
        feed.siteUrl = 'url';
        expect(feed.siteUrl).toBe('url');
        
        expect(feed.favicon).toBeUndefined();
        feed.favicon = 'fav';
        expect(feed.favicon).toBe('fav');
        expect(feed.faviconUrl).toBe('/userdata/favicons/fav');
        
        expect(feed.category).toBe('ą First Category');
        feed.category = 'wtf?';
        expect(feed.category).toBe('wtf?');
        
        expect(feed.averageActivity).toBeUndefined();
        feed.averageActivity = 7;
        expect(feed.averageActivity).toBe(7);
        
        expect(feed.remove).toBeDefined();
    });
    
    describe('events', function () {
        
        it('fires event when feed added', function () {
            var spy = jasmine.createSpy();
            $rootScope.$on('feedAdded', spy);
            feedsService.addFeed({
                url: 'something.com/feed'
            });
            expect(spy).toHaveBeenCalled();
            expect(spy.calls.mostRecent().args[1].url).toBe('something.com/feed');
        });
        
        it("fires event when feed's siteUrl specified", function () {
            var spy = jasmine.createSpy();
            $rootScope.$on('feedSiteUrlSpecified', spy);
            var f = feedsService.addFeed({
                url: 'something.com/feed',
            });
            f.siteUrl = 'something.com';
            expect(spy).toHaveBeenCalled();
            expect(spy.calls.mostRecent().args[1].url).toBe('something.com/feed');
        });
        
        it('fires event when feed removed', function () {
            var spy = jasmine.createSpy();
            $rootScope.$on('feedRemoved', spy);
            var feed = feedsService.getFeedByUrl('a.com/feed');
            feed.remove();
            expect(spy).toHaveBeenCalled();
            expect(spy.calls.mostRecent().args[1].url).toBe('a.com/feed');
        });
        
        it('fires event for every feed when category of feeds removed', function () {
            var spy = jasmine.createSpy();
            $rootScope.$on('feedRemoved', spy);
            feedsService.tree[0].remove();
            expect(spy.calls.count()).toBe(2);
        });
        
        it('fires event after opml imported', function () {
            var spy = jasmine.createSpy();
            $rootScope.$on('feedsImported', spy);
            feedsService.importOpml('<opml><body></body></opml>');
            expect(spy).toHaveBeenCalled();
        });
        
    });
    
});