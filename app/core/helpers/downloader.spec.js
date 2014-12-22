import feedsModel from '../models/feeds';
import articlesModel from '../models/articles';
import feedParserService from './feed_parser';
import downloaderService from './downloader';

var os = require('os');
var moment = require('moment');
var jetpack = require('fs-jetpack');

describe('downloader', function () {

    var feeds;
    var articles;
    var downloader;
    var $httpBackend;

    var tmpdir = os.tmpdir() + '/sputnik_unit_tests';

    beforeEach(module('sputnik', function ($provide) {
        $provide.service('feeds', feedsModel);
        $provide.service('articles', articlesModel);
        $provide.service('feedParser', feedParserService);
        $provide.service('downloader', downloaderService);
    }));

    beforeEach(inject(function (_feeds_, _articles_, _downloader_, _$httpBackend_) {
        feeds = _feeds_;
        articles = _articles_;
        downloader = _downloader_;
        $httpBackend = _$httpBackend_;
    }));

    beforeEach(function (done) {
        feeds.init(tmpdir)
        .then(function () {
            return feeds.uncategorized.addFeed({
                url: 'a.com/feed'
            });
        })
        .then(function () {
            return articles.init(tmpdir);
        })
        .then(done);
    });

    afterEach(function() {
        jetpack.dir(tmpdir, { exists: false });
    });

    it("fills feed's data after xml loaded", function (done) {
        var feedXml = '<rss version="2.0">' +
                '<channel>' +
                    '<title>Site A</title>' +
                    '<link>a.com</link>' +
                '</channel>' +
            '</rss>';
        $httpBackend.whenGET("a.com/feed").respond(feedXml);
        var feed = feeds.all[0];
        downloader.download([feed])
        .then(function () {
            expect(feed.siteUrl).toBe('a.com');
            expect(feed.originalName).toBe('Site A');
            done();
        });
        $httpBackend.flush();
    });

    it("stores all articles", function (done) {
        var feedXml = '<rss version="2.0">' +
                '<channel>' +
                    '<item>' +
                        '<title>Article 1</title>' +
                        '<description>Hello World!</description>' +
                        '<guid>a.com/art1</guid>' +
                        '<link>http://a.com/art1</link>' +
                        '<pubDate>Sun, 06 Sep 2009 16:20:00 +0000</pubDate>' +
                    '</item>' +
                '</channel>' +
            '</rss>';
        $httpBackend.whenGET("a.com/feed").respond(feedXml);
        var feed = feeds.all[0];
        downloader.download([feed])
        .then(function () {
            return articles.query({ feedId: feed.id });
        })
        .then(function (result) {
            expect(result.length).toBe(1);
            expect(result[0].title).toBe('Article 1');
            expect(result[0].body).toBe('Hello World!');
            expect(result[0].guid).toBe('a.com/art1');
            expect(result[0].url).toBe('http://a.com/art1');
            expect(moment('Sun, 06 Sep 2009 16:20:00 +0000').diff(result[0].pubDate, 'seconds')).toBe(0);
            done();
        });
        $httpBackend.flush();
    });

    it("marks old articles as abandoned", function (done) {
        var feedState1 = '<rss version="2.0">' +
                '<channel>' +
                    '<item>' +
                        '<title>Article 1</title>' +
                        '<link>http://a.com/art1</link>' +
                    '</item>' +
                '</channel>' +
            '</rss>';
        var feedState2 = '<rss version="2.0">' +
                '<channel>' +
                    '<item>' +
                        '<title>Article 2</title>' + // <-- changed 1 to 2
                        '<link>http://a.com/art2</link>' + // <-- changed 1 to 2
                    '</item>' +
                '</channel>' +
            '</rss>';
        var feed = feeds.all[0];

        var currFeedState = feedState1;
        $httpBackend.whenGET("a.com/feed").respond(function () {
            return [200, currFeedState, {}];
        });

        downloader.download([feed])
        .then(function () {
            return articles.query({ feedId: feed.id });
        })
        .then(function (result) {
            expect(result.length).toBe(1);
            expect(result[0].url).toBe('http://a.com/art1');
            expect(result[0].abandoned).toBe(false);

            // Now time passes, old article disappeared from XML,
            // and new appeared, and we are downloading again this feed.
            currFeedState = feedState2;

            downloader.download([feed])
            .then(function () {
                return articles.query({ feedId: feed.id });
            })
            .then(function (result) {
                expect(result.length).toBe(2);
                expect(result[0].url).toBe('http://a.com/art2');
                expect(result[0].abandoned).toBe(false);
                expect(result[1].url).toBe('http://a.com/art1');
                expect(result[1].abandoned).toBe(true);
                done();
            });
            $httpBackend.flush();

        });
        $httpBackend.flush();
    });

    xit("deals gracefully with broken feed URLs", function (done) {

    });

    xit("deals gracefully with invalid articles", function (done) {

    });

    xit("informs you when is working and about progress", function (done) {

    });

});
