import articlesStorage from '../models/articles_storage';
import articlesServiceClass from './articles';

describe('articlesService', function () {
    
    // format returned by feedsHarvester
    var harvest = [
        {
            "title": "art3",
            "description": "description3",
            "link": "link3",
            "pubDate": new Date(3),
        },
        {
            "title": "art2",
            "description": "description2",
            "link": "link2",
            "guid": "guid2",
            "pubDate": new Date(2),
        },
        {
            "title": "art1",
            "description": "description1",
            "link": "link1",
            "pubDate": new Date(1),
        }
    ];
    
    var $rootScope;
    var articlesService;
    
    beforeEach(module('sputnik', function($provide) {
        $provide.value('articlesStorage', articlesStorage.make());
        $provide.value('feedsService', {
            getFeedByUrl: function (feedUrl) {
                return {};
            },
            feeds: []
        });
        $provide.service('articlesService', articlesServiceClass);
    }));
    
    beforeEach(inject(function (_$rootScope_, _articlesService_) {
        $rootScope = _$rootScope_;
        articlesService = _articlesService_;
    }));
    
    it('should know its database size', function () {
        expect(typeof articlesService.dbSize).toBe('number');
    });
    
    it('should pass to storage this methods', function () {
        expect(articlesService.removeAllForFeed).toBeDefined();
        expect(articlesService.removeOlderThan).toBeDefined();
    });
    
    it('article object spec', function (done) {
        articlesService.digest('a.com/feed', harvest)
        .then(function () {
            return articlesService.getArticles(['a.com/feed'], 0, 3);
        })
        .then(function (result) {
            var art = result.articles[0];
            expect(art.id).toBeDefined();
            expect(art.pubDate.getTime()).toBe(art.pubTime);
            done();
        });
    });
    
    it('should fire event when article tags change', function (done) {
        var article;
        var spy = jasmine.createSpy();
        articlesService.digest('a.com/feed', harvest)
        .then(function () {
            return articlesService.getArticles(['a.com/feed'], 0, 3);
        })
        .then(function (result) {
            article = result.articles[0];
            $rootScope.$on('articleReadStateChanged', spy);
            return article.setIsRead(true);
        })
        .then(function () {
            expect(spy).toHaveBeenCalled();
            expect(spy.calls.mostRecent().args[1]).toBe(article);
            done();
        });
    });
    
    describe('tagging', function () {
        
        it('should have tags list (sorted)', function (done) {
            expect(articlesService.allTags.length).toBe(0);
            articlesService.addTag('ź')
            .then(function () {
                return articlesService.addTag('ą');
            })
            .then(function () {
                return articlesService.addTag('ć');
            })
            .then(function () {
                expect(articlesService.allTags.length).toBe(3);
                expect(articlesService.allTags[0].name).toBe('ą');
                expect(articlesService.allTags[1].name).toBe('ć');
                expect(articlesService.allTags[2].name).toBe('ź');
                done();
            });
        });
        
        it('should fire event when tags list change', function (done) {
            var addSpy = jasmine.createSpy('add');
            var changeSpy = jasmine.createSpy('change');
            var removeSpy = jasmine.createSpy('remove');
            $rootScope.$on('tagsListChanged', addSpy);
            articlesService.addTag('tag1')
            .then(function (tag) {
                expect(addSpy).toHaveBeenCalled();
                $rootScope.$on('tagsListChanged', changeSpy);
                return tag.setName('other name');
            })
            .then(function () {
                expect(changeSpy).toHaveBeenCalled();
                $rootScope.$on('tagsListChanged', removeSpy);
                var tag = articlesService.allTags[0];
                return tag.remove();
            })
            .then(function () {
                expect(removeSpy).toHaveBeenCalled();
                done();
            });
        });
        
        it('article can be tagged, tags list is sorted', function (done) {
            var art;
            articlesService.digest('a.com/feed', harvest)
            .then(function () {
                return articlesService.getArticles(['a.com/feed'], 0, 3);
            })
            .then(function (result) {
                art = result.articles[0];
                return art.addNewTag('ź');
            })
            .then(function () {
                return art.addNewTag('ą');
            })
            .then(function () {
                return art.addNewTag('ć');
            })
            .then(function () {
                expect(art.tags.length).toBe(3);
                expect(art.tags[0].name).toBe('ą');
                expect(art.tags[1].name).toBe('ć');
                expect(art.tags[2].name).toBe('ź');
                done();
            });
        });
        
        it('article can toggle tag', function (done) {
            var art;
            var tag;
            articlesService.digest('a.com/feed', harvest)
            .then(function () {
                return articlesService.addTag('tag1')
            })
            .then(function (addedTag) {
                tag = addedTag;
                return articlesService.getArticles(['a.com/feed'], 0, 3);
            })
            .then(function (result) {
                art = result.articles[0];
                return art.toggleTag(tag.id);
            })
            .then(function () {
                expect(art.tags.length).toBe(1);
                expect(art.tags[0].name).toBe('tag1');
                return art.toggleTag(tag.id);
            })
            .then(function () {
                expect(art.tags.length).toBe(0);
                done();
            });
        });
        
        it('should fire event when article tags change', function (done) {
            var article;
            var addSpy = jasmine.createSpy('add');
            var toggleSpy = jasmine.createSpy('toggle');
            articlesService.digest('a.com/feed', harvest)
            .then(function () {
                return articlesService.getArticles(['a.com/feed'], 0, 3);
            })
            .then(function (result) {
                article = result.articles[0];
                $rootScope.$on('articleTagsChanged', addSpy);
                return article.addNewTag('tag');
            })
            .then(function (tag) {
                expect(addSpy).toHaveBeenCalled();
                expect(addSpy.calls.mostRecent().args[1]).toBe(article);
                $rootScope.$on('articleTagsChanged', toggleSpy);
                return article.toggleTag(article.tags[0].id);
            })
            .then(function () {
                expect(toggleSpy).toHaveBeenCalled();
                expect(toggleSpy.calls.mostRecent().args[1]).toBe(article);
                done();
            });
        });
        
    });
    
});