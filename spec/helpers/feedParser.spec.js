import feedParser from 'helpers/feedParser';

var fs = require('fs');

describe('feedParser', function () {
    
    it("should parse Atom feed", function (done) {
        var buff = fs.readFileSync('./assets/atom.xml'); 
        feedParser.parse(buff).then(function (result) {
            expect(result.meta.title).toBe('Paul Irish');
            expect(result.meta.link).toBe('http://paulirish.com/');
            expect(result.articles.length).toBe(20);
            expect(result.articles[0].title).toBe('WebKit for Developers');
            done();
        });
    });
    
    it("should parse RSSv2 feed", function (done) {
        var buff = fs.readFileSync('./assets/rss2.xml'); 
        feedParser.parse(buff).then(function (result) {
            expect(result.meta.title).toBe('The Weinberg Foundation');
            expect(result.meta.link).toBe('http://www.the-weinberg-foundation.org');
            expect(result.articles.length).toBe(10);
            expect(result.articles[0].title).toBe('Liquid fission: The best thing since sliced bread?');
            done();
        });
    });
    
    it("should convert to UTF-8 any feed encoded in different charset", function (done) {
        var buff = fs.readFileSync('./assets/iso-encoded.xml');
        feedParser.parse(buff).then(function (result) {
            expect(result.articles[0].title).toBe('ąśćńłóżźĄŚŻĆŃÓŁ');
            expect(result.articles[0].description).toBe('ąśćńłóżźĄŚŻĆŃÓŁ');
            done();
        });
    });
    
});