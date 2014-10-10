export default function () {
    
    var xmldoc = require('xmldoc');

    var isOpml = function (fileContent) {
        var xml = new xmldoc.XmlDocument(fileContent);
        return xml.name === 'opml';
    };
    
    var importOpml = function (fileContent, feedsStorage) {
        var xml = new xmldoc.XmlDocument(fileContent);
        
        function isFeed(outline) {
            return outline.attr.type === 'rss' ||
                (outline.attr.type === undefined && outline.attr.xmlUrl !== undefined);
        }
        
        function addFeed(xmlNode, categoryName) {
            if (!xmlNode.attr.xmlUrl) {
                return;
            }
            feedsStorage.addFeed({
                'url': xmlNode.attr.xmlUrl,
                'siteUrl': xmlNode.attr.htmlUrl,
                'title': xmlNode.attr.title || xmlNode.attr.text,
                'category': categoryName
            });
        }
        
        function addCategory(categoryNode, categoryName) {
            categoryNode.childrenNamed('outline').forEach(function (subOutline) {
                if (isFeed(subOutline)) {
                    // feed
                    addFeed(subOutline, categoryName);
                } else if (subOutline.children.length > 0) {
                    // subcategory
                    // not supported in Sputnik, flatten it to main category
                    addCategory(subOutline, categoryName);
                }
            });
        }
        
        function getRootContainer(xml) {
            
            function hasSubCategory(outlines) {
                for (var i = 0; i < outlines.length; i += 1) {
                    console.log(outlines[i].childrenNamed('outline'))
                    if (outlines[i].childrenNamed('outline').length > 0) {
                        return true;
                    }
                }
                return false;
            }
            
            // obvious default
            var root = xml.childNamed('body');
            if (root.childrenNamed('outline').length === 1) {
                // only one outline in main container, it looks suspicious
                
                // this should work but doesn't because of bug in xmldoc
                //if (root.descendantWithPath("outline.outline.outline") !== undefined) {
                // so instead we are using...
                if (hasSubCategory(root.childNamed('outline').childrenNamed('outline'))) {
                    // there are 3 levels of outline nesting, so omit the highest level,
                    // because it is root container without other useful role
                    root = root.childNamed('outline');
                }
            }
            return root;
        }
        
        if (xml.name === 'opml') {
            var root = getRootContainer(xml);
            root.childrenNamed('outline').forEach(function (outline) {
                if (isFeed(outline)) {
                    // feed
                    addFeed(outline, undefined);
                } else if (outline.children.length > 0) {
                    // category
                    var categoryName = outline.attr.title || outline.attr.text;
                    addCategory(outline, categoryName);
                }
            });
        }
    };
    
    var exportOpml = function (feedsStorage) {
        
        function feedAttributes(xmlElement, feed) {
            xmlElement.att('text', feed.title || 'Feed');
            xmlElement.att('title', feed.title || 'Feed');
            xmlElement.att('type', 'rss');
            xmlElement.att('xmlUrl', feed.url);
            if (feed.siteUrl) {
                xmlElement.att('htmlUrl', feed.siteUrl);
            }
        }
        
        var builder = require('xmlbuilder');
        
        var categories = {};
        var uncategorizedFeeds = [];
        
        feedsStorage.feeds.forEach(function (feed) {
            if (feed.category) {
                if (!categories[feed.category]) {
                    categories[feed.category] = [];
                }
                categories[feed.category].push(feed);
            } else {
                uncategorizedFeeds.push(feed);
            }
        });
        
        var root = builder.create('opml', { 'version': '1.0', 'encoding': 'UTF-8' }).att('version', '1.0');
        root.ele('head').ele('title', 'Subscriptions from Sputnik');
        var body = root.ele('body');
        Object.keys(categories).forEach(function (categoryName) {
            var element = body.ele('outline');
            element.att('title', categoryName);
            element.att('text', categoryName);
            categories[categoryName].forEach(function (feed) {
                var categoryElement = element.ele('outline');
                feedAttributes(categoryElement, feed);
            });
        });
        uncategorizedFeeds.forEach(function (feed) {
            var element = body.ele('outline');
            feedAttributes(element, feed);
        });
        
        return root.end({ pretty: true });
    };
    
    return {
        isOpml: isOpml,
        import: importOpml,
        export: exportOpml,
    };
}