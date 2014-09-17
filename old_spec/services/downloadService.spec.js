'use strict';

describe('downloadService', function () {
    
    var Q = require('q');
    var fse = require('fs-extra');
    var moment = require('moment');
    
    var feedsStorage = require('../app/models/feedsStorage');
    var articlesStorage = require('../app/models/articlesStorage');
    var feedParser = require('../app/helpers/feedParser');
    var feedsWaitingRoom = require('../app/helpers/feedsWaitingRoom');
    var netMock = require('./mocks/net.mock');
    
    var net = netMock.make({
        "http://atom-xml": fse.readFileSync('./data/atom.xml'),
        "http://rss2-xml": fse.readFileSync('./data/rss2.xml'),
        "http://html": '<html><head></head></html>',
        
        // just pass on this values
        "a.com/feed": 'a.com/feed',
        "b.com/feed": 'b.com/feed',
    });
    
    var feedsWaitingRoomStoragePath = 'temp/feeds-waiting';
    
    beforeEach(function () {
        var done = false;
        
        feedsStorage.make()
        .then(function (fst) {
            module('sputnik', function($provide) {
                $provide.value('feedsStorage', fst);
                $provide.value('articlesStorage', articlesStorage.make());
                $provide.value('net', net);
                $provide.value('opml', {});
                $provide.value('feedParser', feedParser);
                $provide.value('feedsWaitingRoom', feedsWaitingRoom.init(feedsWaitingRoomStoragePath));
                $provide.value('config', {});
            });
            
            done = true;
        });
        
        waitsFor(function () { return done; }, null, 200);
    });
    
    describe('calculating feeds average activity', function () {
        
        it('should assume super active if no article on the list', inject(function (downloadService) {
            var avgAct = downloadService.calculateAverageActivity([]);
            expect(avgAct).toBe(0);
        }));
        
        it('should assume super active if articles have no pubDate', inject(function (downloadService) {
            var avgAct = downloadService.calculateAverageActivity([
                {} // empty object simulationg article without pubDate
            ]);
            expect(avgAct).toBe(0);
        }));
        
        it('should calculate if only one article provided', inject(function (downloadService) {
            var avgAct = downloadService.calculateAverageActivity([
                { pubDate: moment().subtract('hours', 12)._d },
            ]);
            expect(avgAct).toBe(12);
        }));
        
        it('should calculate typical case', inject(function (downloadService) {
            var avgAct = downloadService.calculateAverageActivity([
                { pubDate: moment().subtract('hours', 1)._d },
                { pubDate: moment().subtract('hours', 2)._d },
                { pubDate: moment().subtract('hours', 3)._d },
                { pubDate: moment().subtract('hours', 4)._d },
                { pubDate: moment().subtract('hours', 5)._d },
            ]);
            expect(avgAct).toBe(1);
            avgAct = downloadService.calculateAverageActivity([
                { pubDate: moment().subtract('hours', 2)._d },
                { pubDate: moment().subtract('hours', 4)._d },
                { pubDate: moment().subtract('hours', 6)._d },
                { pubDate: moment().subtract('hours', 8)._d },
                { pubDate: moment().subtract('hours', 10)._d },
            ]);
            expect(avgAct).toBe(2);
        }));
        
    });
    
    describe('preparing fetch baskets', function () {
        
        it('if no averageActivity place everything in HI basket', inject(function (feedsService, config, downloadService) {
            config.lastFeedsDownload = moment().valueOf();
            feedsService.addFeed({
                url: 'a.com/feed'
            });
            feedsService.addFeed({
                url: 'b.com/feed'
            });
            var baskets = downloadService.getActivityBaskets()
            expect(baskets.hi).toEqual(['a.com/feed', 'b.com/feed']);
            expect(baskets.lo).toEqual([]);
        }));
        
        it('if last download was more than 3 days ago place everything in HI basket', inject(function (feedsService, config, downloadService) {
            config.lastFeedsDownload = moment().subtract('hours', 73).valueOf();
            feedsService.addFeed({
                url: 'a.com/feed',
                averageActivity: 1,
            });
            feedsService.addFeed({
                url: 'b.com/feed',
                averageActivity: 250, // should be in hi basket although activity not indicates that
            });
            var baskets = downloadService.getActivityBaskets()
            expect(baskets.hi).toEqual(['a.com/feed', 'b.com/feed']);
            expect(baskets.lo).toEqual([]);
            
        }));
        
        // if someone hits refresh after 10min from last one none feeds will go into hi basket, so force more sensible behaviour then
        it('if last download was less than 24h ago place in HI basket things like it was 24h ago', inject(function (feedsService, config, downloadService) {
            config.lastFeedsDownload = moment().subtract('hours', 1).valueOf();
            feedsService.addFeed({
                url: 'a.com/feed',
                averageActivity: 25,
            });
            feedsService.addFeed({
                url: 'b.com/feed',
                averageActivity: 73,
            });
            var baskets = downloadService.getActivityBaskets()
            expect(baskets.hi).toEqual(['a.com/feed']);
            expect(baskets.lo).toEqual(['b.com/feed']);
        }));
        
        it('if HI basket is empty LO basket should be switched to HI', inject(function (feedsService, config, downloadService) {
            config.lastFeedsDownload = moment().subtract('hours', 1).valueOf();
            feedsService.addFeed({
                url: 'a.com/feed',
                averageActivity: 73,
            });
            feedsService.addFeed({
                url: 'b.com/feed',
                averageActivity: 74,
            });
            var baskets = downloadService.getActivityBaskets()
            expect(baskets.hi).toEqual(['a.com/feed', 'b.com/feed']);
            expect(baskets.lo).toEqual([]);
        }));
        
    });
    
    describe('downloading', function () {
        
        it('should terminate gracefully when no feeds to download', inject(function (net, feedsService, downloadService) {
            var done = false;
            // feedsService is empty
            downloadService.download()
            .then(function () {
                done = true;
            });
            waitsFor(function () { return done; }, null, 500);
        }));
        
        it("should deal with edge cases", inject(function (feedsService, downloadService) {
            var done = false;
            
            feedsService.addFeed({
                url: 'timeout',
            });
            feedsService.addFeed({
                url: 'not-found',
            });
            feedsService.addFeed({
                url: 'unknown-error',
            });
            feedsService.addFeed({
                url: 'http://404',
            });
            feedsService.addFeed({
                url: 'http://html', // html instead of feed xml goes to parser
            });
            feedsService.addFeed({
                url: 'http://atom-xml',
            });
            feedsService.addFeed({
                url: 'http://rss2-xml',
            });
            
            var firedProgressCount = 0;
            downloadService.download()
            .then(
                function (result) {
                    expect(firedProgressCount).toBe(7);
                    result.backgroundJob.then(function () {
                        done = true;
                    });
                },
                null,
                function (progress) {
                    // progress fires with any just fetched feed
                    firedProgressCount += 1;
                    
                    expect(progress.completed).toBeGreaterThan(0);
                    expect(progress.completed).toBeLessThan(8);
                    expect(progress.total).toBe(7);
                }
            );
            waitsFor(function () { return done; }, null, 500);
        }));
        
        it('should try to download again in background feed which in normal mode got timeout', inject(function (net, feedsService, downloadService) {
            var done = false;
            var spy = jasmine.createSpy();
            net.injectGeturlSpy(spy);
            feedsService.addFeed({
                url: 'timeout',
            });
            feedsService.addFeed({
                url: 'http://404',
            });
            downloadService.download()
            .then(function (result) {
                return result.backgroundJob;
            })
            .then(function () {
                expect(spy.callCount).toBe(3); // 2 calls from timeout and 1 from http://404
                done = true;
            });
            waitsFor(function () { return done; }, null, 500);
        }));
        
        it('should give up (assume no connectoin) when 5 connection errors in a row', inject(function (net, feedsService, downloadService) {
            var done = false;
            
            feedsService.addFeed({
                url: 'timeout1',
            });
            feedsService.addFeed({
                url: 'timeout2',
            });
            feedsService.addFeed({
                url: 'not-found',
            });
            feedsService.addFeed({
                url: 'connection-refused',
            });
            feedsService.addFeed({
                url: 'timeout5',
            });
            downloadService.download()
            .then(null,
            function (message) {
                expect(message).toBe('No connection');
                expect(downloadService.isWorking).toBe(false);
                done = true;
            });
            waitsFor(function () { return done; }, null, 500);
        }));
        
        it('should give up when less than 5 feeds and all returned eror', inject(function (net, feedsService, downloadService) {
            var done = false;
            
            feedsService.addFeed({
                url: 'timeout1',
            });
            feedsService.addFeed({
                url: 'not-found',
            });
            feedsService.addFeed({
                url: 'connection-refused',
            });
            downloadService.download()
            .then(null,
            function (message) {
                expect(message).toBe('No connection');
                expect(downloadService.isWorking).toBe(false);
                done = true;
            });
            waitsFor(function () { return done; }, null, 500);
        }));
        
        it('should do fine if parsed feed is already removed from the app', inject(function (feedsService, downloadService) {
            var done = false;
            var feed = feedsService.addFeed({
                url: 'http://atom-xml',
            });
            downloadService.download()
            .then(function () {
                done = true;
            });
            feed.remove();
            waitsFor(function () { return done; }, null, 500);
        }));
        
    });
    
    describe('comprehensive test', function () {
        
        function generateArticles(feedName, num, timeGap) {
            var arts = [];
            while (num > 0) {
                arts.push({
                    title: "title",
                    description: "description",
                    link: "link" + feedName + num,
                    pubDate: moment().subtract('hours', (arts.length + 1) * timeGap)._d,
                });
                num -= 1;
            }
            return arts;
        }
        
        var articles = {
            'a.com/feed': generateArticles('a', 3, 48),
            'b.com/feed': generateArticles('b', 9, 600),
        };
        
        beforeEach(module('sputnik', function($provide) {
            $provide.value('feedParser', {
                parse: function (key) {
                    var deferred = Q.defer();
                    deferred.resolve({
                        meta: {},
                        articles: articles[key]
                    });
                    return deferred.promise;
                }
            });
        }));
        
        beforeEach(function () {
            if (fse.existsSync(feedsWaitingRoomStoragePath)) {
                fse.removeSync(feedsWaitingRoomStoragePath);
            }
        });
        
        it('full download cycle', inject(function (config, feedsService, articlesService, downloadService) {
            var doneCount = 0;
            
            config.lastFeedsDownload = moment().subtract('days', 2).valueOf();
            
            feedsService.addFeed({
                url: 'a.com/feed',
                averageActivity: 5
            });
            feedsService.addFeed({
                url: 'b.com/feed',
                averageActivity: 999
            });
            
            var feedA = feedsService.getFeedByUrl('a.com/feed');
            var feedB = feedsService.getFeedByUrl('b.com/feed');
            
            expect(feedA.averageActivity).toBe(5);
            expect(feedB.averageActivity).toBe(999);
            
            expect(downloadService.isWorking).toBe(false);
            
            downloadService.download()
            .then(function (result) {
                
                expect(feedA.averageActivity).toBe(48);
                
                // only main job is indicated by isWorking
                expect(downloadService.isWorking).toBe(false);
                
                // should have saved time of this download
                expect(config.lastFeedsDownload).toBeGreaterThan(moment().subtract('minute', 1).valueOf());
                
                // digested articles should be accesible through articlesService
                articlesService.getArticles(['a.com/feed'], 0, 100)
                .then(function (result) {
                    expect(result.numAll).toBe(3);
                    doneCount += 1;
                });
                
                return result.backgroundJob;
            })
            .then(function () {
                // feeds downloaded in background should be just saved to feedsWaitingRoom
                var files = fse.readdirSync(feedsWaitingRoomStoragePath);
                expect(files.length).toBe(1);
                
                return articlesService.getArticles(['b.com/feed'], 0, 100);
            })
            .then(function (result) {
                // so feed b should not be in database yet
                expect(result.numAll).toBe(0);
                
                return downloadService.download();
            })
            .then(function (result) {
                
                // feeds from waitingRoom should be digested with next call of download()
                expect(feedB.averageActivity).toBe(600);
                
                // file from feedsWaitingRoom should be gone
                var files = fse.readdirSync(feedsWaitingRoomStoragePath);
                expect(files.length).toBe(0);
                
                // now feed B should be digested, so articles should be reachable
                articlesService.getArticles(['b.com/feed'], 0, 100)
                .then(function (result) {
                    expect(result.numAll).toBe(9);
                    doneCount += 1;
                });
                
                return result.backgroundJob;
            })
            .then(function (result) {
                doneCount += 1;
            });
            
            expect(downloadService.isWorking).toBe(true);
            
            waitsFor(function () { return doneCount === 3; }, null, 500);
        }));
        
    });
    
});