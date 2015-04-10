import opmlHelper from './opml';
import feedsModel from './feeds';

var jetpack = require('fs-jetpack');
var os = require('os');
var parseString = require('xml2js').parseString;

describe('opml', function () {

    var tmpdir = os.tmpdir() + '/sputnik_unit_tests';
    var opml;
    var feeds;

    beforeEach(module('sputnik', function($provide) {
        $provide.service('opml', opmlHelper);
        $provide.service('feeds', feedsModel);
    }));

    beforeEach(inject(function (_opml_, _feeds_) {
        opml = _opml_;
        feeds = _feeds_;
    }));

    afterEach(function() {
        jetpack.remove(tmpdir);
    });

    var reload = function () {
        return feeds.init(tmpdir);
    };

    describe('importing', function () {

        it('throws if not valid opm given', function (done) {
            var notOpml1 = 'Woot?';
            var notOpml2 = '<data><something>Woot?</something></data>';
            reload()
            .then(function () {
                opml.import(notOpml1)
                .catch(function (err) {
                    expect(err).toBe('Invalid OPML');
                    opml.import(notOpml2)
                    .catch(function (err) {
                        expect(err).toBe('Invalid OPML');
                        done();
                    });
                });
            });
        });

        it('adds categories and feeds', function (done) {
            var opmlContent = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<opml version="1.0">' +
                    '<body>' +
                        '<outline text="Cat 1">' +
                            '<outline text="a" title="a" type="rss" xmlUrl="a.com/feed"/>' +
                        '</outline>' +
                        '<outline title="b" type="rss" xmlUrl="b.com/feed"/>' +
                        '<outline text="c" type="rss" xmlUrl="c.com/feed"/>' +
                    '</body>' +
                '</opml>';

            reload()
            .then(function () {
                return opml.import(opmlContent);
            })
            .then(function () {
                expect(feeds.categories.length).toBe(1);
                expect(feeds.uncategorized.feeds.length).toBe(2);
                expect(feeds.all.length).toBe(3);

                expect(feeds.categories[0].name).toBe('Cat 1');
                expect(feeds.categories[0].feeds.length).toBe(1);
                expect(feeds.categories[0].feeds[0].url).toBe('a.com/feed');

                expect(feeds.uncategorized.feeds[0].url).toBe('b.com/feed');
                expect(feeds.uncategorized.feeds[1].url).toBe('c.com/feed');

                done();
            });
        });

        it('should omit main category if used as root container', function (done) {
            var nestedOpml = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<opml version="1.0">' +
                    '<body>' +
                        '<outline text="My Feeds">' +
                            '<outline text="Cat 1">' +
                                '<outline text="a" type="rss" xmlUrl="a.com/feed"/>' +
                            '</outline>' +
                            '<outline text="b" type="rss" xmlUrl="b.com/feed"/>' +
                        '</outline>' +
                    '</body>' +
                '</opml>';

            reload()
            .then(function () {
                return opml.import(nestedOpml);
            })
            .then(function () {
                expect(feeds.categories.length).toBe(1);
                expect(feeds.categories[0].name).toBe("Cat 1");
                expect(feeds.uncategorized.feeds.length).toBe(1);
                expect(feeds.all.length).toBe(2);

                done();
            });
        });

        it('ignores invalid outlines', function (done) {
            var opmlContent = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<opml version="1.0">' +
                    '<body>' +
                        '<something text="blah">' + // should be ignored because is not an outline
                            '<outline text="blah blah" type="rss" xmlUrl="http://blah.com"/>' +
                        '</something>' +
                        '<outline text="song.mp3" type="song"/>' + // should be ignored if is of different type
                        '<outline text="Wazup?" type="rss"/>' + // should be ignored if no xmlUrl
                        '<outline text="Wazup again?" type="rss"/>' + // should be ignored if lacking xmlUrl even if type is ok
                    '</body>' +
                '</opml>';

            reload()
            .then(function () {
                return opml.import(opmlContent);
            })
            .then(function () {
                expect(feeds.categories.length).toBe(0);
                expect(feeds.all.length).toBe(0);

                done();
            });
        });

    });

    describe('exporting', function () {

        it('creates empty OPML from empty storage', function (done) {
            reload()
            .then(function () {
                var opmlFileContent = opml.export();
                parseString(opmlFileContent, function (err, xml) {
                    expect(xml.opml).toBeDefined();
                    expect(xml.opml.head).toBeDefined();
                    expect(xml.opml.body).toEqual(['']);
                    done();
                });
            });
        });

        it('creates OPML', function (done) {
            reload()
            .then(function () {
                return feeds.addCategory({
                    name: 'Cat 1'
                });
            })
            .then(function () {
                return feeds.categories[0].addFeed({
                    url: 'a.com/feed'
                });
            })
            .then(function () {
                return feeds.uncategorized.addFeed({
                    url: 'b.com/feed'
                });
            })
            .then(function () {
                var opmlFileContent = opml.export();
                parseString(opmlFileContent, function (err, xml) {
                    expect(xml.opml.body[0].outline).toEqual([
                        {
                            "$": {
                                "text": "Cat 1"
                            },
                            "outline": [
                                {
                                    "$": {
                                        "text": "",
                                        "type": "rss",
                                        "xmlUrl": "a.com/feed"
                                    }
                                }
                            ]
                        },
                        {
                            "$": {
                                "text": "",
                                "type": "rss",
                                "xmlUrl": "b.com/feed"
                            }
                        }
                    ]);
                    done();
                });
            })
        });
    });

});
