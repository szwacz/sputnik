import feedsModel from '../models/feeds';
import articlesModel from '../models/feeds';
import feedParserService from './feed_parser';
import downloaderService from './downloader';

var os = require('os');
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

    xit("stores all articles", function (done) {

    });

    xit("marks old articles as abandoned", function (done) {

    });

    xit("deals gracefully with broken feed URLs", function (done) {

    });

    xit("deals gracefully with invalid articles", function (done) {

    });

    xit("informs you when is working and about progress", function (done) {

    });

});
