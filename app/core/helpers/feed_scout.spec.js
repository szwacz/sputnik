import feedParserService from './feed_parser';
import scoutService from './feed_scout';

var jetpack = require('fs-jetpack');

describe('feedScout', function () {

    var atomXml = jetpack.read('./core/helpers/spec_assets/atom.xml');
    var rss2Xml = jetpack.read('./core/helpers/spec_assets/rss2.xml');

    var htmlLinkAtom = '<html><head><link href="http://atom-xml" type="application/atom+xml"></head><body></body></html>';
    var htmlLinkRss = '<html><head><link href="http://rss2-xml" type="application/rss+xml"></head><body></body></html>';
    // Sometimes relative links are given
    var htmlLinkRelativeRss = '<html><head><link href="/rss2-xml" type="application/rss+xml"></head><body></body></html>';
    // HTML has link to RSS, but this link returns invalid RSS
    var htmlLinkHtml = '<html><head><link href="http://html-link-rss" type="application/rss+xml"></head><body></body></html>';
    var htmlNoLink = '<html><head></head><body></body></html>';
    // HTML has link to RSS, but this link returns 404
    var htmlLink404 = '<html><head><link href="http://404" type="application/rss+xml"></head><body></body></html>';

    var scout;
    var $httpBackend;

    beforeEach(module('sputnik', function ($provide) {
        $provide.service('scout', scoutService);
        $provide.service('feedParser', feedParserService);
    }));

    beforeEach(inject(function (_scout_, _$httpBackend_) {
        scout = _scout_;
        $httpBackend = _$httpBackend_;
    }));

    it("should return nothing if 404", function (done) {
        $httpBackend.whenGET("http://404").respond(404);
        scout.scout('http://404').fail(function (err) {
            expect(err.code).toBe('404');
            done();
        });
        $httpBackend.flush();
    });

    it("should deal with Atom XML", function (done) {
        $httpBackend.whenGET("http://atom-xml").respond(atomXml);
        scout.scout('http://atom-xml').then(function (feedUrl) {
            expect(feedUrl).toBe('http://atom-xml');
            done();
        });
        $httpBackend.flush();
    });

    it("should deal with RSS XML", function (done) {
        $httpBackend.whenGET("http://rss2-xml").respond(rss2Xml);
        scout.scout('http://rss2-xml').then(function (feedUrl) {
            expect(feedUrl).toBe('http://rss2-xml');
            done();
        });
        $httpBackend.flush();
    });

    it("should deal with HTML with <link> to Atom", function (done) {
        $httpBackend.whenGET("http://html-link-atom").respond(htmlLinkAtom);
        $httpBackend.whenGET("http://atom-xml").respond(atomXml);
        scout.scout('http://html-link-atom').then(function (feedUrl) {
            expect(feedUrl).toBe('http://atom-xml');
            done();
        });
        $httpBackend.flush();
        setTimeout($httpBackend.flush, 0); // There are 2 ajax calls in waterfall
    });

    it("should deal with HTML with <link> to RSS", function (done) {
        $httpBackend.whenGET("http://html-link-rss").respond(htmlLinkRss);
        $httpBackend.whenGET("http://rss2-xml").respond(rss2Xml);
        scout.scout('http://html-link-rss').then(function (feedUrl) {
            expect(feedUrl).toBe('http://rss2-xml');
            done();
        });
        $httpBackend.flush();
        setTimeout($httpBackend.flush, 0); // There are 2 ajax calls in waterfall
    });

    it("should deal with HTML with RELATIVE <link> to RSS", function (done) {
        $httpBackend.whenGET("http://html-link-relative-rss").respond(htmlLinkRelativeRss);
        $httpBackend.whenGET("http://html-link-relative-rss/rss2-xml").respond(rss2Xml);
        scout.scout('http://html-link-relative-rss').then(function (feedUrl) {
            expect(feedUrl).toBe('http://html-link-relative-rss/rss2-xml');
            done();
        });
        $httpBackend.flush();
        setTimeout($httpBackend.flush, 0); // There are 2 ajax calls in waterfall
    });

    it("should return nothing if HTML has no <link> tag", function (done) {
        $httpBackend.whenGET("http://html-no-link").respond(htmlNoLink);
        scout.scout('http://html-no-link').fail(function (err) {
            expect(err.code).toBe('noFeed');
            done();
        });
        $httpBackend.flush();
    });

    it("should return nothing if HTMLs <link> gets 404", function (done) {
        $httpBackend.whenGET("http://html-link-404").respond(htmlLink404);
        $httpBackend.whenGET("http://404").respond(404);
        scout.scout('http://html-link-404').fail(function (err) {
            expect(err.code).toBe('404');
            done();
        });
        $httpBackend.flush();
        setTimeout($httpBackend.flush, 0); // There are 2 ajax calls in waterfall
    });

    it("should return nothing if HTMLs <link> gets HTML instead of feed format", function (done) {
        $httpBackend.whenGET("http://html-link-html").respond(htmlLinkHtml);
        $httpBackend.whenGET("http://html-link-rss").respond(htmlLinkRss);
        scout.scout('http://html-link-html').fail(function (err) {
            expect(err.code).toBe('noFeed');
            done();
        });
        $httpBackend.flush();
        setTimeout($httpBackend.flush, 0); // There are 2 ajax calls in waterfall
    });

});
