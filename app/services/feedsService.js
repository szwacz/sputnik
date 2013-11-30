'use strict';

function feedsService($rootScope, feedsStorage, opml, config) {
    
    var Q = require('q');
    
    var feeds = [];
    var tree;
    var treeObsolete = true;
    var totalUnreadCount = 0;
    
    //-----------------------------------------------------
    // Helper functions
    //-----------------------------------------------------
    
    function localeSort(a, b) {
        return a.localeCompare(b);
    }
    
    function treeSort(a, b) {
        if (a.type === 'category' && b.type === 'feed') {
            return -1;
        }
        if (a.type === 'feed' && b.type === 'category') {
            return 1;
        }
        if ((a.type === 'category' && b.type === 'category') ||
            (a.type === 'feed' && b.type === 'feed')) {
            return a.title.localeCompare(b.title);
        }
        return 0;
    }
    
    function rebuildTree() {
        tree = [];
        feedsStorage.categories.forEach(function (categoryName) {
            tree.push(constructCategory(categoryName));
        });
        feeds.forEach(function (feed) {
            if (!feed.category) {
                tree.push(feed);
            }
        });
        tree.sort(treeSort);
        recountUnreadArticlesInternal();
        treeObsolete = false;
    }
    
    function getFeedsForCategory(categoryName) {
        var catFeeds = [];
        feeds.forEach(function (feed) {
            if (feed.category === categoryName) {
                catFeeds.push(feed);
            }
        });
        return catFeeds;
    }
    
    function constructFeed(feedModel) {
        return {
            type: 'feed',
            unreadArticlesCount: 0,
            get url() {
                return feedModel.url;
            },
            
            get title() {
                return feedModel.title || '...';
            },
            set title(value) {
                if (feedModel.title !== value) {
                    feedsStorage.setFeedValue(feedModel.url, 'title', value);
                }
            },
            get siteUrl() {
                return feedModel.siteUrl;
            },
            set siteUrl(value) {
                if (feedModel.siteUrl !== value) {
                    feedsStorage.setFeedValue(feedModel.url, 'siteUrl', value);
                    $rootScope.$broadcast('feedSiteUrlSpecified', this);
                }
            },
            get favicon() {
                if (!feedModel.favicon) {
                    return undefined;
                }
                return config.dataHomeFolder + '/favicons/' + feedModel.favicon;
            },
            set favicon(value) {
                if (feedModel.favicon !== value) {
                    feedsStorage.setFeedValue(feedModel.url, 'favicon', value);
                }
            },
            
            get category() {
                return feedModel.category;
            },
            set category(value) {
                feedsStorage.setFeedValue(feedModel.url, 'category', value);
                treeObsolete = true;
            },
            
            get averageActivity() {
                return feedModel.averageActivity;
            },
            set averageActivity(value) {
                if (feedModel.averageActivity !== value) {
                    feedsStorage.setFeedValue(feedModel.url, 'averageActivity', value);
                }
            },
            
            remove: function () {
                feedsStorage.removeFeed(feedModel.url);
                constructFeedsList();
                
                $rootScope.$broadcast('feedRemoved', this);
            },
        };
    }
    
    function constructCategory(categoryName) {
        var categoryFeeds = getFeedsForCategory(categoryName);
        categoryFeeds.sort(treeSort);
        return {
            type: 'category',
            title: categoryName,
            feeds: categoryFeeds,
            unreadArticlesCount: 0,
            setTitle : function (newName) {
                feedsStorage.changeCategoryName(categoryName, newName);
                treeObsolete = true;
            },
            remove: function () {
                this.feeds.forEach(function (feed) {
                    feed.remove();
                });
                feedsStorage.removeCategory(categoryName);
                constructFeedsList();
            },
        };
    }
    
    function constructFeedsList() {
        var newFeedsList = [];
        feedsStorage.feeds.forEach(function (feedModel) {
            var feed = getFeedByUrl(feedModel.url);
            if (!feed) {
                feed = constructFeed(feedModel);
            }
            newFeedsList.push(feed);
        });
        feeds = newFeedsList;
        treeObsolete = true;
    }
    
    function recountUnreadArticlesInternal() {
        totalUnreadCount = 0;
        tree.forEach(function (treeItem) {
            if (treeItem.type === 'category') {
                var catCount = 0;
                treeItem.feeds.forEach(function (feed) {
                    catCount += feed.unreadArticlesCount;
                });
                treeItem.unreadArticlesCount = catCount;
                totalUnreadCount += catCount;
            } else {
                totalUnreadCount += treeItem.unreadArticlesCount;
            }
        });
    }
    
    function recountUnreadArticles() {
        recountUnreadArticlesInternal();
        $rootScope.$broadcast('unreadArticlesRecounted');
    }
    
    //-----------------------------------------------------
    // Init
    //-----------------------------------------------------
    
    constructFeedsList();
    rebuildTree();
    
    $rootScope.$on('unreadArticlesCountChanged', function (evt, feedUrl, count) {
        var feed = getFeedByUrl(feedUrl);
        
        if (!feed) {
            return;
        }
        
        feed.unreadArticlesCount = count;
        recountUnreadArticles();
    });
    
    function getCategoryByName(name) {
        for (var i = 0; i < tree.length; i += 1) {
            if (tree[i].type === 'category' && tree[i].title === name) {
                return tree[i];
            }
        }
        return null;
    }
    
    //-----------------------------------------------------
    // API methods
    //-----------------------------------------------------
    
    function importOpml(fileContent) {
        opml.import(fileContent, feedsStorage);
        constructFeedsList();
        $rootScope.$broadcast('feedsImported');
    }
    
    function exportOpml() {
        return opml.export(feedsStorage);
    }
    
    function getFeedByUrl(url) {
        for (var i = 0; i < feeds.length; i += 1) {
            if (feeds[i].url === url) {
                return feeds[i];
            }
        }
        return null;
    }
    
    function addFeed(feedModel) {
        feedsStorage.addFeed(feedModel);
        constructFeedsList();
        
        var feed = getFeedByUrl(feedModel.url);
        
        $rootScope.$broadcast('feedAdded', feed);
        
        return feed;
    }
    
    function addCategory(categoryName) {
        feedsStorage.addCategory(categoryName);
        treeObsolete = true;
    }
    
    function digestFeedMeta(feedUrl, meta) {
        var feed = getFeedByUrl(feedUrl);
        if (feed) {
            feed.title = meta.title;
            feed.siteUrl = meta.link;
        }
    }
    
    return  {
        isValidOpml: opml.isOpml,
        importOpml: importOpml,
        exportOpml: exportOpml,
        
        addFeed: addFeed,
        getFeedByUrl: getFeedByUrl,
        addCategory: addCategory,
        
        digestFeedMeta: digestFeedMeta,
        
        get tree() {
            if (treeObsolete) {
                rebuildTree();
            }
            return tree;
        },
        
        get categoriesNames() {
            var cats = feedsStorage.categories.concat();
            cats.sort(localeSort);
            return cats;
        },
        
        get feeds() {
            return feeds;
        },
        get title() {
            return 'All';
        },
        get unreadArticlesCount() {
            return totalUnreadCount;
        },
    };
}