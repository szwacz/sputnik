var Nedb = require('nedb');
var _ = require('underscore');
var Q = require('q');
var pathUtil = require('path');
var jetpack = require('fs-jetpack');

export default function () {

    var userDataStorageDir;
    var categoriesDb;
    var feedsDb;
    var categories;
    var allFeeds;
    var uncategorizedCategory;

    // Overriden push methods which takes care also for correct
    // order of items in collection anytime something is added.
    var categoriesPush = function (item) {
        Array.prototype.push.call(this, item);
        this.sort(function (a, b) {
            // Ordinary alphabetical sort
            return a.name.localeCompare(b.name);
        });
    };
    var feedsPush = function (item) {
        Array.prototype.push.call(this, item);
        this.sort(function (a, b) {
            // Ordinary alphabetical sort
            return a.name.localeCompare(b.name);
        });
    };

    var init = function (_userDataStorageDir_) {
        var deferred = Q.defer();

        userDataStorageDir = jetpack.cwd(_userDataStorageDir_);
        categories = [];
        categories.push = categoriesPush;
        allFeeds = [];

        var categoriesPath = userDataStorageDir.path('feed_categories.db');
        var feedsPath = userDataStorageDir.path('feeds.db');

        categoriesDb = new Nedb({ filename: categoriesPath, autoload: true });
        feedsDb = new Nedb({ filename: feedsPath, autoload: true });

        // First load all feeds...
        feedsDb.find({}, function (err, rawFeeds) {
            if (!err) {
                // Now load all categories...
                categoriesDb.find({}, function (err, rawCats) {
                    if (!err) {
                        // Decorate raw feeds data from database
                        // with useful methods and stuff.
                        rawCats.forEach(function (rawCat) {
                            categories.push(decorateCategory(rawCat));
                        });

                        // Add special category which contains all actually
                        // uncategorized feeds. This category is not saved
                        // in database.
                        uncategorizedCategory = decorateCategory({
                            _id: 'uncategorized'
                        });
                        uncategorizedCategory.update = _.noop;
                        uncategorizedCategory.remove = _.noop;

                        // Decorate raw feeds data from database with special
                        // stuff, and register feeds to theirs categories.
                        rawFeeds.forEach(function (rawFeed) {
                            var feed = decorateFeed(rawFeed);
                            allFeeds.push(feed);
                            feed.category.feeds.push(feed);
                        });

                        deferred.resolve();
                    }
                });
            }
        });

        return deferred.promise;
    };

    var decorateFeed = function (feedData) {
        return {
            get id() { return feedData._id; },
            get url() { return feedData.url; },
            get originalName() {
                // feedData.originalName - name as red from feed's XML
                return feedData.originalName;
            },
            get name() {
                // feedData.name - customized name given to feed by user
                return feedData.name || feedData.originalName || '';
            },
            get category() { return getCategoryById(feedData.categoryId); },
            get favicon() {
                if (feedData.faviconType) {
                    return userDataStorageDir.path('feed_favicons', this.id + '.' + feedData.faviconType);
                }
                return null;
            },
            update: function (data) {
                return updateFeed(feedData, data);
            },
            setCategory: function (newCategory) {
                // Remove this feed from current category listing
                var index = this.category.feeds.indexOf(this);
                this.category.feeds.splice(index, 1);
                // Add it to new category
                newCategory.feeds.push(this);
                // Save new state in database
                var catId;
                if (newCategory.id === 'uncategorized') {
                    catId = undefined;
                } else {
                    catId = newCategory.id;
                }
                return updateFeed(feedData, {
                    categoryId: catId
                });
            },
            remove: function () {
                return removeFeed(this);
            },
            storeFavicon: function (faviconBytes, fileExtension) {
                return storeFeedFavicon(this, faviconBytes, fileExtension);
            },
        };
    };

    var decorateCategory = function (categoryData) {
        var feedsArr = [];
        feedsArr.push = feedsPush;
        return {
            get id() { return categoryData._id; },
            get name() { return categoryData.name; },
            feeds: feedsArr,
            update: function (data) {
                return updateCategory(categoryData, data);
            },
            remove: function () {
                return removeCategory(this);
            },
            addFeed: function (feedData) {
                feedData.categoryId = this.id;
                return addFeed(feedData);
            },
        };
    };

    var getCategoryById = function (id) {
        if (!id || id === 'uncategorized') {
            return uncategorizedCategory;
        }
        return _.findWhere(categories, { id: id });
    };

    var getFeedById = function (id) {
        return _.findWhere(allFeeds, { id: id });
    };

    var addFeed = function (data) {
        var deferred = Q.defer();
        if (typeof data.url !== 'string' || data.url === '') {
            deferred.reject("Feed's URL must be specified");
        } else {
            if (data.categoryId === uncategorizedCategory.id) {
                data.categoryId = undefined;
            }
            feedsDb.insert(data, function (err, newFeedRawData) {
                if (!err) {
                    var feed = decorateFeed(newFeedRawData);
                    allFeeds.push(feed);
                    var cat = getCategoryById(newFeedRawData.categoryId);
                    cat.feeds.push(feed);
                    deferred.resolve();
                }
            });
        }
        return deferred.promise;
    };

    var updateFeed = function (feedRawData, newData) {
        var deferred = Q.defer();
        _.extend(feedRawData, newData);
        feedsDb.update({ _id: feedRawData._id }, feedRawData, {}, function (err) {
            if (!err) {
                deferred.resolve();
            }
        });
        return deferred.promise;
    };

    var removeFeed = function (feed) {
        var deferred = Q.defer();
        feedsDb.remove({ _id: feed.id }, {}, function (err) {
            if (!err) {
                var index = allFeeds.indexOf(feed);
                allFeeds.splice(index, 1);
                index = feed.category.feeds.indexOf(feed);
                feed.category.feeds.splice(index, 1);
                deferred.resolve();
            }
        });
        return deferred.promise;
    };

    var storeFeedFavicon = function (feed, faviconBytes, fileExtension) {
        var deferred = Q.defer();
        var path = userDataStorageDir.path('feed_favicons', feed.id + '.' + fileExtension);
        userDataStorageDir.writeAsync(path, faviconBytes)
        .then(function () {
            return feed.update({
                faviconType: fileExtension
            });
        })
        .then(deferred.resolve);
        return deferred.promise;
    };

    var addCategory = function (data) {
        var deferred = Q.defer();
        categoriesDb.insert(data, function (err, newCategoryRawData) {
            if (!err) {
                categories.push(decorateCategory(newCategoryRawData));
                deferred.resolve();
            }
        });
        return deferred.promise;
    };

    var updateCategory = function (catRawData, newData) {
        var deferred = Q.defer();
        _.extend(catRawData, newData);
        categoriesDb.update({ _id: catRawData._id }, catRawData, function (err) {
            if (!err) {
                deferred.resolve();
            }
        });
        return deferred.promise;
    };

    var removeCategory = function (cat) {
        var deferred = Q.defer();
        var promises = cat.feeds.map(function (feed) {
            return feed.remove();
        });
        Q.all(promises)
        .then(function () {
            categoriesDb.remove({ _id: cat.id }, {}, function (err) {
                if (!err) {
                    var index = categories.indexOf(cat);
                    categories.splice(index, 1);
                    deferred.resolve();
                }
            });
        });
        return deferred.promise;
    };

    return {
        get categories() { return categories; },
        get uncategorized() { return uncategorizedCategory; },
        get all() { return allFeeds; },
        init: init,
        getFeedById: getFeedById,
        addCategory: addCategory,
    };
};
