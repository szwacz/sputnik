import feedParserService from './feed_parser';

var jetpack = require('fs-jetpack');

describe('feedParser', function () {

    beforeEach(module('sputnik', function ($provide) {
        $provide.service('feedParser', feedParserService);
    }));

    var feedParser;

    beforeEach(inject(function (_feedParser_) {
        feedParser = _feedParser_;
    }));

    it("should parse Atom feed", function (done) {
        var buf = jetpack.read('./core/helpers/spec_assets/atom.xml', 'buf');
        feedParser.parse(buf).then(function (result) {
            expect(result.meta.title).toBe('Example Feed');
            expect(result.meta.link).toBe('http://example.org/');
            expect(result.articles.length).toBe(1);
            expect(result.articles[0].title).toBe('Atom-Powered Robots Run Amok');
            done();
        });
    });

    it("should parse RSSv2 feed", function (done) {
        var buf = jetpack.read('./core/helpers/spec_assets/rss2.xml', 'buf');
        feedParser.parse(buf).then(function (result) {
            expect(result.meta.title).toBe('RSS Title');
            expect(result.meta.link).toBe('http://www.example.com/main.html');
            expect(result.articles.length).toBe(1);
            expect(result.articles[0].title).toBe('Example entry');
            done();
        });
    });

    it("should convert to UTF-8 any feed encoded in different charset", function (done) {
        var buf = jetpack.read('./core/helpers/spec_assets/iso-encoded.xml', 'buf');
        feedParser.parse(buf).then(function (result) {
            expect(result.articles[0].title).toBe('ąśćńłóżźĄŚŻĆŃÓŁ');
            expect(result.articles[0].description).toBe('ąśćńłóżźĄŚŻĆŃÓŁ');
            done();
        });
    });

});
