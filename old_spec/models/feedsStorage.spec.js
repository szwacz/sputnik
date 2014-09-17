'use strict';

describe('feedsStorage', function () {
    
    var feedsStorage = require('../app/models/feedsStorage');
    
    it('should init with no data', function () {
        var done = false;
        feedsStorage.make()
        .then(function (fst) {
            expect(fst.categories.length).toBe(0);
            expect(fst.feeds.length).toBe(0);
            done = true;
        });
        waitsFor(function () { return done; }, null, 200);
    });
    
    it('can add feed', function () {
        var done = false;
        feedsStorage.make()
        .then(function (fst) {
            var feedData = {
                url: "a.com/feed/",
                siteUrl: "a.com",
                title: "Site A",
                category: "Category 1",
                favicon: "./path/to/favicon.png"
            };
            fst.addFeed(feedData)
            .then(function (addedFeed) {
                expect(feedData).toEqual(addedFeed);
                expect(feedData).toEqual(fst.feeds[0]);
                done = true;
            });
        });
        waitsFor(function () { return done; }, null, 200);
    });
    
    it('should not allow to add same feed many times', function () {
        var done = false;
        feedsStorage.make()
        .then(function (fst) {
            var feedData = {
                url: "a.com/feed"
            };
            var f1, f2;
            fst.addFeed(feedData)
            .then(function (addedFeed) {
                f1 = addedFeed;
                return fst.addFeed(feedData);
            })
            .then(function (addedFeed) {
                f2 = addedFeed;
                expect(fst.feeds.length).toBe(1);
                expect(f1).toEqual(f2);
                done = true;
            });
        });
        waitsFor(function () { return done; }, null, 200);
    });
    
    it('can add new category', function () {
        var done = false;
        feedsStorage.make()
        .then(function (fst) {
            fst.addCategory('Cool Category');
            expect(fst.categories.length).toBe(1);
            expect(fst.categories).toContain('Cool Category');
            done = true;
        });
        waitsFor(function () { return done; }, null, 200);
    });
    
    it("can't add new category with invalid name", function () {
        var done = false;
        feedsStorage.make()
        .then(function (fst) {
            fst.addCategory('');
            expect(fst.categories.length).toBe(0);
            done = true;
        });
        waitsFor(function () { return done; }, null, 200);
    });
    
    it('should not allow to add 2 categories with same name', function () {
        var done = false;
        var fst = feedsStorage.make()
        .then(function (fst) {
            fst.addCategory("Cool Category");
            fst.addCategory("Cool Category");
            expect(fst.categories.length).toBe(1);
            done = true;
        });
        waitsFor(function () { return done; }, null, 200);
    });
    
    it('can add new feed with category set', function () {
        var done = false;
        feedsStorage.make()
        .then(function (fst) {
            fst.addFeed({
                url: "a.com/feed",
                category: "Cool Category"
            });
            expect(fst.feeds.length).toBe(1);
            expect(fst.categories.length).toBe(1);
            expect(fst.categories).toContain('Cool Category');
            done = true;
        });
        waitsFor(function () { return done; }, null, 200);
    });
    
    it('can change any feed value', function () {
        var done = false;
        feedsStorage.make()
        .then(function (fst) {
            fst.addFeed({
                url: "a.com/feed"
            })
            .then(function (feed) {
                return fst.setFeedValue(feed.url, 'favicon', 'favicon.gif')
            })
            .then(function (feed) {
                expect(feed.favicon).toBe('favicon.gif');
                done = true;
            });
        });
        waitsFor(function () { return done; }, null, 200);
    });
    
    it('can change feed category', function () {
        var done = false;
        feedsStorage.make()
        .then(function (fst) {
            fst.addFeed({
                url: "a.com/feed",
                category: 'A'
            })
            .then(function (feed) {
                return fst.setFeedValue(feed.url, 'category', 'B');
            })
            .then(function (feed) {
                expect(feed.category).toBe('B');
                expect(fst.categories).toEqual(['A', 'B']);
                done = true;
            });
        });
        waitsFor(function () { return done; }, null, 200);
    });
    
    it('can remove feed category', function () {
        var done = false;
        feedsStorage.make()
        .then(function (fst) {
            var f = fst.addFeed({
                url: "a.com/feed",
                category: 'A'
            });
            
            f = fst.setFeedValue(f.url, 'category', '');
            expect(f.category).toBeUndefined();
            expect(fst.categories).toEqual(['A']);
            done = true;
        });
        waitsFor(function () { return done; }, null, 200);
    });
    
    it('can delete feed', function () {
        var done = false;
        feedsStorage.make()
        .then(function (fst) {
            fst.addFeed({
                url: 'a.com/feed'
            });
            fst.removeFeed('a.com/feed');
            expect(fst.feeds.length).toBe(0);
            done = true;
        });
        waitsFor(function () { return done; }, null, 200);
    });
    
    it('should delete category and feeds assigned to that category', function () {
        var done = false;
        feedsStorage.make()
        .then(function (fst) {
            fst.addFeed({
                url: 'a.com/feed',
                category: 'Cool Category'
            });
            fst.addFeed({
                url: 'b.com/feed',
                category: 'Cool Category'
            });
            fst.removeCategory('Cool Category');
            expect(fst.categories.length).toBe(0);
            expect(fst.feeds.length).toBe(0);
            done = true;
        });
        waitsFor(function () { return done; }, null, 200);
    });
    
    it('can change category name', function () {
        var done = false;
        feedsStorage.make()
        .then(function (fst) {
            fst.addFeed({
                url: 'a.com/feed',
                category: 'Cool Category'
            });
            fst.changeCategoryName('Cool Category', 'Better Name')
            .then(function () {
                expect(fst.categories).toEqual(['Better Name']);
                expect(fst.feeds[0].category).toBe('Better Name');
                done = true;
            });
        });
        waitsFor(function () { return done; }, null, 200);
    });
    
    it("can't change category name to invalid one", function () {
        var done = false;
        feedsStorage.make()
        .then(function (fst) {
            fst.addFeed({
                url: 'a.com/feed',
                category: 'Cool Category'
            });
            fst.changeCategoryName('Cool Category', '')
            .then(function () {
                expect(fst.categories).toEqual(['Cool Category']);
                expect(fst.feeds[0].category).toBe('Cool Category');
                done = true;
            });
        });
        waitsFor(function () { return done; }, null, 200);
    });
    
    it("change category name for the same name has no effect", function () {
        var done = false;
        feedsStorage.make()
        .then(function (fst) {
            fst.addFeed({
                url: 'a.com/feed',
                category: 'Cool Category'
            });
            fst.changeCategoryName('Cool Category', 'Cool Category')
            .then(function () {
                expect(fst.categories).toEqual(['Cool Category']);
                expect(fst.feeds[0].category).toBe('Cool Category');
                done = true;
            });
        });
        waitsFor(function () { return done; }, null, 200);
    });
    
    it('can create new category via feed property', function () {
        var done = false;
        feedsStorage.make()
        .then(function (fst) {
            fst.addFeed({
                url: 'a.com/feed',
                category: 'Cool Category'
            })
            .then(function (feed) {
                return fst.setFeedValue(feed.url, 'category', 'Better Name');
            })
            .then(function (feed) {
                expect(feed.category).toBe('Better Name');
                expect(fst.categories.length).toBe(2);
                expect(fst.categories).toContain('Better Name');
                expect(fst.feeds[0].category).toBe('Better Name');
                done = true;
            });
        });
        waitsFor(function () { return done; }, null, 200);
    });
    
    it('should merge two categories if name of one was changed to name of the other', function () {
        var done = false;
        feedsStorage.make()
        .then(function (fst) {
            fst.addFeed({
                url: 'a.com/feed',
                category: 'Cool Category'
            });
            fst.addFeed({
                url: 'b.com/feed',
                category: 'Second Category'
            });
            fst.changeCategoryName('Second Category', 'Cool Category');
            expect(fst.categories.length).toBe(1);
            expect(fst.feeds.length).toBe(2);
            expect(fst.feeds[0].category).toBe('Cool Category');
            expect(fst.feeds[1].category).toBe('Cool Category');
            done = true;
        });
        waitsFor(function () { return done; }, null, 200);
    });
    
    it('should terminate gracefully when setFeedValue gets nonexistent feedUrl', function () {
        var done = false;
        feedsStorage.make()
        .then(function (fst) {
            fst.setFeedValue('blah', 'favicon', 'abc');
            done = true;
        });
        waitsFor(function () { return done; }, null, 200);
    });
    
    
    describe('disk persistance', function () {
        
        var fs = require('fs');
        
        var filePath = './temp/feeds.json';
        var feedsData = {
            "categories": [
                "Second Category", "First Category"
            ],
            "feeds": [
                {
                    "url": "a.com/feed",
                    "siteUrl": "a.com",
                    "title": "Site A",
                    "category": "First Category",
                    "favicon": "fav.png"
                },
                {
                    "url": "b.com/feed",
                    "siteUrl": "b.com/",
                    "title": "Site B",
                }
            ]
        };
        
        beforeEach(function () {
            fs.writeFileSync(filePath, JSON.stringify(feedsData), { encoding: 'utf8' });
        });
        
        function eraseFile() {
            fs.unlinkSync(filePath);
        }
        
        function grabFromDisk() {
            return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }));
        }
        
        it("should init when data file doesn't exist", function () {
            
            eraseFile();
            
            var done = false;
            feedsStorage.make(filePath)
            .then(function (fst) {
                expect(fst.categories.length).toBe(0);
                expect(fst.feeds.length).toBe(0);
                done = true;
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        // should save recent data to disk after any of this actions:
        
        it('test addFeed', function () {
            
            eraseFile();
            
            var done = false;
            feedsStorage.make(filePath)
            .then(function (fst) {
                var f1 = {
                    url: 'a.com/feed',
                    category: 'Cool Category'
                };
                fst.addFeed(f1)
                .then(function () {
                    var savedData = grabFromDisk();
                    expect(savedData.categories).toContain('Cool Category');
                    expect(savedData.feeds[0]).toEqual(f1);
                    done = true;
                });
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('test removeFeed', function () {
            var done = false;
            feedsStorage.make(filePath)
            .then(function (fst) {
                fst.removeFeed('b.com/feed')
                .then(function () {
                    var savedData = grabFromDisk();
                    expect(savedData.feeds.length).toBe(1);
                    done = true;
                });
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('test setFeedValue', function () {
            var done = false;
            feedsStorage.make(filePath)
            .then(function (fst) {
                fst.setFeedValue('b.com/feed', 'favicon', 'abc')
                .then(function () {
                    var savedData = grabFromDisk();
                    expect(savedData.feeds[1].favicon).toBe('abc');
                    done = true;
                });
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('test addCategory', function () {
            var done = false;
            feedsStorage.make(filePath)
            .then(function (fst) {
                fst.addCategory('Third Category')
                .then(function () {
                    var savedData = grabFromDisk();
                    expect(savedData.categories).toContain('Third Category');
                    done = true;
                });
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('test changeCategoryName', function () {
            var done = false;
            feedsStorage.make(filePath)
            .then(function (fst) {
                fst.changeCategoryName('First Category', 'New Name')
                .then(function () {
                    var savedData = grabFromDisk();
                    expect(savedData.categories).toContain('New Name');
                    done = true;
                });
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
        it('test removeCategory', function () {
            var done = false;
            feedsStorage.make(filePath)
            .then(function (fst) {
                fst.removeCategory('First Category')
                .then(function () {
                    var savedData = grabFromDisk();
                    expect(savedData.categories).not.toContain('First Category');
                    done = true;
                });
            });
            waitsFor(function () { return done; }, null, 200);
        });
        
    });
    
});