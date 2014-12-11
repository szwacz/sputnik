var xml2js = require('xml2js');
var builder = require('xmlbuilder');
var _ = require('underscore');
var Q = require('q');

export default function (feeds) {

    var importOpml = function (opmlFileContent) {
        var deferred = Q.defer();

        xml2js.parseString(opmlFileContent, function (err, xml) {
            if (err || !xml.opml) {
                deferred.reject('Invalid OPML');
                return;
            }

            var promises = [];

            var isValidFeedOutline = function (outline) {
                return outline.$.type === 'rss' && outline.$.xmlUrl !== undefined;
            };

            var addAllNestedFeedOutlines = function (outline, category) {
                var promises = [];
                if (outline.outline) {
                    // Even more levels of nested categories.
                    // Just merge them all into one list.
                    // Sputnik doesn't support nested categories.
                    promises.push(addAllNestedFeedOutlines(outline.outline, category));
                } else if (isValidFeedOutline(outline)) {
                    promises.push(category.addFeed({
                        url: outline.$.xmlUrl
                    }));
                }
                return Q.all(promises);
            };

            var figureOutRootCategory = function (firstOutlineContent) {
                // If there is only one root outline which is actually
                // additional container for real outlines, ignore it and
                // refer to its content directly.
                if (firstOutlineContent.length === 1 &&
                    firstOutlineContent[0].$.type !== 'rss') {
                    return firstOutlineContent[0].outline;
                }
                // Otherwise leave it as it is.
                return firstOutlineContent;
            };

            var rootCategory = figureOutRootCategory(xml.opml.body[0].outline);

            rootCategory.forEach(function (outline) {
                if (Array.isArray(outline.outline)) {
                    // This is a category
                    var name = outline.$.title || outline.$.text;
                    if (!name) {
                        return;
                    }
                    var promise = feeds.getOrCreateCategoryByName(name)
                    .then(function (category) {
                        var promises = [];
                        outline.outline.forEach(function (out) {
                            promises.push(addAllNestedFeedOutlines(out, category));
                        });
                        return Q.all(promises);
                    });
                    promises.push(promise);
                } else if (isValidFeedOutline(outline)) {
                    // This is feed without category
                    promises.push(feeds.uncategorized.addFeed({
                        url: outline.$.xmlUrl
                    }));
                }
            });

            Q.all(promises).then(deferred.resolve);
        });

        return deferred.promise;
    };

    var exportOpml = function (feedsStorage) {

        var passFeedAttributes = function (element, feed) {
            element.att('text', feed.title || '');
            element.att('type', 'rss');
            element.att('xmlUrl', feed.url);
            if (feed.siteUrl) {
                element.att('htmlUrl', feed.siteUrl);
            }
        }

        var root = builder.create('opml', {
            version: '1.0',
            encoding: 'UTF-8',
        });

        root
        .ele('head')
        .ele('title', 'Your Sputnik RSS Subscriptions');

        var body = root.ele('body');

        feeds.categories.forEach(function (category) {
            var element = body.ele('outline');
            element.att('text', category.name);
            category.feeds.forEach(function (feed) {
                passFeedAttributes(element.ele('outline'), feed);
            });
        });

        feeds.uncategorized.feeds.forEach(function (feed) {
            passFeedAttributes(body.ele('outline'), feed);
        });

        return root.end({ pretty: true });
    };

    return {
        import: importOpml,
        export: exportOpml,
    };
}
