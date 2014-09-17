'use strict';

describe('feedParser', function () {
    
    var fs = require('fs');
    
    var feedParser = require('../app/helpers/feedParser');
    
    it("should parse Atom feed", function () {
        var done = false;
        var buff = fs.readFileSync('./data/atom.xml'); 
        feedParser.parse(buff).then(function (result) {
            expect(result.meta.title).toBe('Paul Irish');
            expect(result.meta.link).toBe('http://paulirish.com/');
            expect(result.articles.length).toBe(20);
            expect(result.articles[0].title).toBe('WebKit for Developers');
            done = true;
        });
        waitsFor(function () { return done; }, "timeout", 500);
    });
    
    it("should parse RSSv2 feed", function () {
        var done = false;
        var buff = fs.readFileSync('./data/rss2.xml'); 
        feedParser.parse(buff).then(function (result) {
            expect(result.meta.title).toBe('The Weinberg Foundation');
            expect(result.meta.link).toBe('http://www.the-weinberg-foundation.org');
            expect(result.articles.length).toBe(10);
            expect(result.articles[0].title).toBe('Liquid fission: The best thing since sliced bread?');
            done = true;
        });
        waitsFor(function () { return done; }, "timeout", 500);
    });
    
    it("should convert to UTF-8 any feed encoded in different charset", function () {
        var done = false;
        var buff = fs.readFileSync('./data/iso-encoded.xml');
        feedParser.parse(buff).then(function (result) {
            expect(result.articles[0].title).toBe('ąśćńłóżźĄŚŻĆŃÓŁ');
            expect(result.articles[0].description).toBe('ąśćńłóżźĄŚŻĆŃÓŁ');
            done = true;
        });
        waitsFor(function () { return done; }, "timeout", 500);
    });
    
});