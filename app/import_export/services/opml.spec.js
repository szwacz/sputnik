import opmlService from './opml';
import feedsStorage from '../../core/models/feeds_storage';

var xmldoc = require('xmldoc');

describe('opml', function () {
    
    var opml;
    
    beforeEach(module('sputnik', function($provide) {
        $provide.service('opml', opmlService);
    }));
    
    beforeEach(inject(function (_opml_) {
        opml = _opml_;
    }));
    
    describe('importing', function () {
        
        var opmlContent = '<?xml version="1.0" encoding="UTF-8"?>' +
            '<opml version="1.0">' +
                '<head>' +
                    '<title>My subscriptions</title>' +
                '</head>' +
                '<body>' +
                    '<outline text="Category A">' + // lack of title attr
                        '<outline text="a" title="a" type="rss" xmlUrl="http://a.com/feed" htmlUrl="http://a.com"/>' +
                        '<outline text="b" title="b" type="rss" xmlUrl="http://b.com/feed" htmlUrl="http://b.com"/>' +
                        '<outline text="c" title="c" type="rss" xmlUrl="http://c.com/feed" htmlUrl="http://c.com"/>' +
                    '</outline>' +
                    '<outline text="Wazup?" title="Category B">' + // attr title should be favored over text
                        '<outline text="d" title="d" type="rss" xmlUrl="http://d.com/feed" htmlUrl="http://d.com"/>' +
                        '<outline text="Category C" title="Category C">' + // double nesting should be flattened
                            '<outline text="z" title="z" type="rss" xmlUrl="http://z.com/feed" htmlUrl="http://z.com"/>' +
                        '</outline>' +
                        '<something text="blah">' + // should be ignored because is not outline
                            '<outline text="blah blah" type="rss" xmlUrl="http://blah.com"/>' +
                        '</something>' +
                    '</outline>' +
                    '<outline text="e" type="rss" xmlUrl="http://e.com/feed" htmlUrl="http://e.com"/>' + // lack of title attr
                    '<outline text="f" title="f" type="rss" xmlUrl="http://f.com/feed"/>' + // lack of htmlUrl attr
                    '<outline text="g" xmlUrl="http://g.com/feed"/>' + // if lack of type should still treat as rss if xmlUrl present
                    '<outline text="song.mp3" type="song"/>' + // should be ignored if is different type
                    '<outline text="Wazup?"/>' + // should be ignored if no xmlUrl attr
                    '<outline text="Wazup again?" type="rss"/>' + // should be ignored if lack of xmlUrl attr even if type is ok
                    '<something text="blah">' + // should be ignored because is not outline
                        '<outline text="blah blah" type="rss" xmlUrl="http://blah.com"/>' +
                    '</something>' +
                '</body>' +
            '</opml>';
        
        var nestedOpml = '<?xml version="1.0" encoding="UTF-8"?>' +
            '<opml version="1.0">' +
                '<body>' +
                    '<outline text="My Feeds">' +
                        '<outline text="b" xmlUrl="http://b.com/feed"/>' +
                        '<outline text="Category A">' +
                            '<outline text="a" xmlUrl="http://a.com/feed"/>' +
                        '</outline>' +
                    '</outline>' +
                '</body>' +
            '</opml>';
        
        var simplestOpml = '<?xml version="1.0" encoding="UTF-8"?>' +
            '<opml version="1.0">' +
                '<body>' +
                    '<outline text="My Feeds">' +
                        '<outline text="b" xmlUrl="http://b.com/feed"/>' +
                    '</outline>' +
                '</body>' +
            '</opml>';
        
        it('should say if it is OPML format or not', function () {
            expect(opml.isOpml(opmlContent)).toBeTruthy();
            expect(opml.isOpml('<data><item>Hello!</item></data>')).toBeFalsy();
            expect(opml.isOpml('Something, something.')).toBeFalsy();
        });
        
        it('should add categories and feeds to storage', function (done) {
            feedsStorage.make()
            .then(function (fst) {
                opml.import(opmlContent, fst);
                
                expect(fst.categories.length).toBe(2);
                expect(fst.feeds.length).toBe(8);
                
                // nested categories not supported in sputnik
                expect(fst.categories).not.toContain('Category C');
                
                expect(fst.feeds[0].url).toBe('http://a.com/feed');
                expect(fst.feeds[0].siteUrl).toBe('http://a.com');
                expect(fst.feeds[0].title).toBe('a');
                expect(fst.feeds[0].category).toBe('Category A');
                
                expect(fst.feeds[7].title).toBe('g');
                expect(fst.feeds[7].category).toBeUndefined();
                done();
            });
        });
        
        it('should omit main category if used as root container', function (done) {
            feedsStorage.make()
            .then(function (fst) {
                opml.import(nestedOpml, fst);
                expect(fst.categories.length).toBe(1);
                expect(fst.feeds.length).toBe(2);
                expect(fst.categories).not.toContain('My Feeds');
                expect(fst.feeds[0].url).toBe('http://b.com/feed');
                expect(fst.feeds[0].category).toBeUndefined();
                expect(fst.feeds[1].url).toBe('http://a.com/feed');
                expect(fst.feeds[1].category).toBe('Category A');
                
                return feedsStorage.make();
            })
            .then(function (fst) {
                opml.import(simplestOpml, fst);
                expect(fst.categories.length).toBe(1);
                expect(fst.feeds.length).toBe(1);
                done();
            });
        });
        
        it('should do nothing if not valid OPML was given', function (done) {
            feedsStorage.make()
            .then(function (fst) {
                opml.import('<data><item>Hello!</item></data>', fst);
                opml.import('Not even XML', fst);
                expect(fst.categories.length).toBe(0);
                expect(fst.feeds.length).toBe(0);
                done();
            });
        });
    });
    
    describe('exporting', function () {
        
        it('should create empty OPML from empty storage', function (done) {
            var fst = feedsStorage.make()
            .then(function (fst) {
                var opmlContent = opml.export(fst);
                var xml = new xmldoc.XmlDocument(opmlContent);
                expect(xml.name).toBe('opml');
                expect(xml.childNamed('head').children.length).toBe(1);
                expect(xml.childNamed('body').children.length).toBe(0);
                done();
            });
        });
        
        it('should create OPML', function (done) {
            var fst = feedsStorage.make()
            .then(function (fst) {
                fst.addFeed({
                    url: 'a.com/feed',
                    siteUrl: 'a.com',
                    title: 'a',
                    category: 'First Category ąĄłŁ', // utf8 test
                })
                .then(function () {
                    return fst.addFeed({
                        url: 'b.com/feed',
                        siteUrl: 'b.com',
                        title: 'b',
                        category: 'First Category ąĄłŁ',
                    });
                })
                .then(function () {
                    return fst.addFeed({
                        url: 'c.com/feed',
                    });
                })
                .then(function () {
                    return fst.addFeed({
                        url: 'd.com/feed',
                    });
                })
                .then(function () {
                    var opmlContent = opml.export(fst);
                    var xml = new xmldoc.XmlDocument(opmlContent);
                    
                    expect(xml.childNamed('body').children.length).toBe(3);
                    
                    expect(xml.childNamed('body').children[0].attr.title).toBe('First Category ąĄłŁ');
                    expect(xml.childNamed('body').children[0].attr.text).toBe('First Category ąĄłŁ');
                    expect(xml.childNamed('body').children[0].children.length).toBe(2);
                    expect(xml.childNamed('body').children[0].children[0].attr.text).toBe('a');
                    expect(xml.childNamed('body').children[0].children[1].attr.text).toBe('b');
                    
                    expect(xml.childNamed('body').children[1].attr.text).toBe('Feed');
                    expect(xml.childNamed('body').children[1].attr.title).toBe('Feed');
                    expect(xml.childNamed('body').children[1].attr.type).toBe('rss');
                    expect(xml.childNamed('body').children[1].attr.xmlUrl).toBe('c.com/feed');
                    expect(xml.childNamed('body').children[1].attr.htmlUrl).toBeUndefined();
                    done();
                });
            });
        });
    });
    
});