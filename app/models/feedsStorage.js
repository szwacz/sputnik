'use strict';

var Q = require('q');
var safeFile = require('../helpers/safeFile');

exports.make = function (dataPath) {
    
    var dataFile = safeFile(dataPath);
    
    //-----------------------------------------------------
    // Helper functions
    //-----------------------------------------------------
    
    function getFeedByUrl(url) {
        for (var i = 0; i < model.feeds.length; i += 1) {
            if (model.feeds[i].url === url) {
                return model.feeds[i];
            }
        }
        return null;
    }
    
    function getFeedsForCategory(categoryName) {
        var list = [];
        model.feeds.forEach(function (feed) {
            if (feed.category === categoryName) {
                list.push(feed);
            }
        });
        return list;
    }
    
    function save(responseObj) {
        var def = Q.defer();
        
        if (dataPath) {
            dataFile.write(JSON.stringify(model, null, 4))
            .then(function () {
                def.resolve(responseObj);
            });
        } else {
            def.resolve(responseObj);
        }
        
        return def.promise;
    }
    
    //-----------------------------------------------------
    // API methods
    //-----------------------------------------------------
    
    function addFeed(feedModel) {
        var feed = getFeedByUrl(feedModel.url);
        if (feed) {
            return save(feed);
        }
        
        feed = feedModel;
        
        model.feeds.push(feed);
        
        if (feed.category && model.categories.indexOf(feed.category) === -1) {
            // add category to model if not present
            model.categories.push(feed.category);
        }
        
        return save(feed);
    }
    
    function setFeedValue(feedUrl, key, value) {
        var feed = getFeedByUrl(feedUrl);
        
        if (!feed) {
            return save(null);
        }
        
        if (key === 'category') {
            if (!value || value === '') {
                value = undefined;
            } else {
                addCategory(value);
            }
        }
        
        feed[key] = value;
        
        return save(feed);
    }
    
    function removeFeed(url) {
        var feed = null;
        for (var i = 0; i < model.feeds.length; i += 1) {
            if (model.feeds[i].url === url) {
                feed = model.feeds.splice(i, 1)[0];
                break;
            }
        }
        
        return save(feed);
    }
    
    function addCategory(name) {
        if (name && name !== '' && model.categories.indexOf(name) === -1) {
            model.categories.push(name);
        }
        
        return save();
    }
    
    function changeCategoryName(currentName, newName) {
        var currNameIndex = model.categories.indexOf(currentName);
        if (newName !== undefined && newName !== '' && currNameIndex !== -1) {
            if (model.categories.indexOf(newName) !== -1 && currentName !== newName) {
                // newName already is defined, we are merging two categories together
                // so we must to throw away one of this categories from array
                model.categories.splice(currNameIndex, 1);
            } else {
                model.categories[currNameIndex] = newName;
            }
            
            var categoryFeeds = getFeedsForCategory(currentName);
            categoryFeeds.forEach(function (feed) {
                feed.category = newName;
            });
        }
        
        return save();
    }
    
    function removeCategory(name) {
        for (var i = 0; i < model.categories.length; i += 1) {
            if (model.categories[i] === name) {
                model.categories.splice(i, 1);
                break;
            }
        }
        var categoryFeeds = getFeedsForCategory(name);
        categoryFeeds.forEach(function (feed) {
            removeFeed(feed.url);
        });
        
        return save();
    }
    
    //-----------------------------------------------------
    // Init
    //-----------------------------------------------------
    
    var def = Q.defer();
    var model = {
        categories: [],
        feeds: []
    };
    
    var api = {
        get categories() {
            return model.categories;
        },
        get feeds() {
            return model.feeds;
        },
        addFeed: addFeed,
        removeFeed: removeFeed,
        setFeedValue: setFeedValue,
        addCategory: addCategory,
        changeCategoryName: changeCategoryName,
        removeCategory: removeCategory,
    };
    
    if (dataPath) {
        dataFile.read()
        .then(function (data) {
            if (data !== null) {
                model = JSON.parse(data);
            }
            def.resolve(api);
        });
    } else {
        def.resolve(api);
    }
    
    return def.promise;
}