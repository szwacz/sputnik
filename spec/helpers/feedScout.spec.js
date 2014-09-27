import feedParser from 'helpers/feedParser';
import scout from 'helpers/feedScout';
import netMock from 'mocks/net.mock';

var fs = require('fs');

describe('feedScout', function () {
    
    var atomXml = fs.readFileSync('./assets/atom.xml');
    var rss2Xml = fs.readFileSync('./assets/rss2.xml');
    
    var htmlLinkAtom = '<html><head><link href="http://atom-xml" title="The Site" type="application/atom+xml"></head></html>';
    var htmlLinkRss = '<html><head><link href="http://rss2-xml" title="The Site" type="application/rss+xml"></head></html>';
    // sometimes relative links are given
    var htmlLinkRelativeRss = '<html><head><link href="/rss2-xml" title="The Site" type="application/rss+xml"></head></html>';
    // HTML has link to RSS, but this link returns 404
    var htmlLink404 = '<html><head><link href="http://404" title="The Site" type="application/rss+xml"></head></html>';
    var htmlLinkTimeout = '<html><head><link href="http://timeout" title="The Site" type="application/rss+xml"></head></html>';
    var htmlLinkNotFound = '<html><head><link href="http://not-found" title="The Site" type="application/rss+xml"></head></html>';
    // HTML has link to RSS, but this link returns invalid RSS
    var htmlLinkHtml = '<html><head><link href="http://html-link-rss" title="The Site" type="application/rss+xml"></head></html>';
    var htmlNoLink = '<html><head></head></html>';
    
    var net = netMock.make({
        "http://atom-xml": atomXml,
        "http://rss2-xml": rss2Xml,
        "http://html-link-atom": htmlLinkAtom,
        "http://html-link-rss": htmlLinkRss,
        "http://html-link-relative-rss": htmlLinkRelativeRss,
        "http://html-link-relative-rss/rss2-xml": rss2Xml,
        "http://html-no-link": htmlNoLink,
        "http://html-link-404": htmlLink404,
        "http://html-link-timeout": htmlLinkTimeout,
        "http://html-link-not-found": htmlLinkNotFound,
        "http://html-link-html": htmlLinkHtml,
    });

    
    it("should return nothing if 404", function (done) {
        scout.scout('http://404', net, feedParser).fail(function (err) {
            expect(err.code).toBe('404');
            done();
        });
    });
    
    it("should return nothing if timeout", function (done) {
        scout.scout('timeout', net, feedParser).fail(function (err) {
            expect(err.code).toBe('ETIMEDOUT');
            done();
        });
    });
    
    it("should return nothing if address not found", function (done) {
        scout.scout('not-found', net, feedParser).fail(function (err) {
            expect(err.code).toBe('ENOTFOUND');
            done();
        });
    });
    
    it("should deal with Atom XML", function (done) {
        scout.scout('http://atom-xml', net, feedParser).then(function (feedUrl) {
            expect(feedUrl).toBe('http://atom-xml');
            done();
        });
    });
    
    it("should deal with RSS XML", function (done) {        
        scout.scout('http://rss2-xml', net, feedParser).then(function (feedUrl) {
            expect(feedUrl).toBe('http://rss2-xml');
            done();
        });
    });
    
    it("should deal with HTML with <link> to Atom", function (done) {
        scout.scout('http://html-link-atom', net, feedParser).then(function (feedUrl) {
            expect(feedUrl).toBe('http://atom-xml');
            done();
        });
    });
    
    it("should deal with HTML with <link> to RSS", function () {
        scout.scout('http://html-link-rss', net, feedParser).then(function (feedUrl) {
            expect(feedUrl).toBe('http://rss2-xml');
            done();
        });
    });
    
    it("should deal with HTML with RELATIVE <link> to RSS", function (done) {
        scout.scout('http://html-link-relative-rss', net, feedParser).then(function (feedUrl) {
            expect(feedUrl).toBe('http://html-link-relative-rss/rss2-xml');
            done();
        });
    });
    
    it("should return nothing if HTML has no <link> tag", function (done) {
        scout.scout('http://html-no-link', net, feedParser).fail(function (err) {
            expect(err.code).toBe('noFeed');
            done();
        });
    });
    
    it("should return nothing if HTMLs <link> gets 404", function (done) {
        scout.scout('http://html-link-404', net, feedParser).fail(function (err) {
            expect(err.code).toBe('404');
            done();
        });
    });
    
    it("should return nothing if HTMLs <link> gets timeout", function (done) {
        scout.scout('http://html-link-timeout', net, feedParser).fail(function (err) {
            expect(err.code).toBe('ETIMEDOUT');
            done();
        });
    });
    
    it("should return nothing if HTMLs <link> gets timeout", function (done) {
        scout.scout('http://html-link-not-found', net, feedParser).fail(function (err) {
            expect(err.code).toBe('ENOTFOUND');
            done();
        });
    });
    
    it("should return nothing if HTMLs <link> gets HTML instead of feed format", function (done) {
        scout.scout('http://html-link-html', net, feedParser).fail(function (err) {
            expect(err.code).toBe('noFeed');
            done();
        });
    });
    
});