/**
 * Manages articles. Decorates raw objects from database with extra functionality.
 */

'use strict';

function articlesService($rootScope, articlesStorage, feedsService) {
    
    var Q = require('q');
    
    var tags;
    
    //-----------------------------------------------------
    // Helper functions
    //-----------------------------------------------------
    
    function getTag(tagId) {
        for (var i = 0; i < tags.length; i += 1) {
            if (tags[i]._id === tagId) {
                return tags[i];
            }
        }
        return null;
    }
    
    function mapTagIdsToTags(tagsIds) {
        if (!tagsIds || tagsIds.length === 0) {
            return [];
        }
        var tags = tagsIds.map(getTag);
        tags.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });
        return tags;
    }
    
    function hasTag(art, tagId) {
        for (var i = 0; i < art.tags.length; i += 1) {
            if (art.tags[i].id === tagId) {
                return true;
            }
        }
        return false;
    }
    
    function decorateTag(tag) {
        tag.id = tag._id;
        tag.setName = function (newName) {
            return articlesStorage.changeTagName(tag.id, newName)
            .then(function (result) {
                return reloadTags();
            });
        }
        tag.remove = function () {
            return articlesStorage.removeTag(tag.id)
            .then(function () {
                return reloadTags();
            });
        }
    }
    
    function recountUnread(feedUrl) {
        var deferred = Q.defer();
        
        articlesStorage.countUnread(feedUrl)
        .then(function (count) {
            $rootScope.$broadcast('unreadArticlesCountChanged', feedUrl, count);
            deferred.resolve(count);
        });
        
        return deferred.promise;
    }
    
    function reloadTags() {
        var deferred = Q.defer();
        
        articlesStorage.getTags()
        .then(function (refreshedTags) {
            refreshedTags.forEach(decorateTag);
            tags = refreshedTags;
            $rootScope.$broadcast('tagsListChanged');
            deferred.resolve();
        });
        
        return deferred.promise;
    }
    
    function decorateArticle(art) {
        art.id = 'article-' + art._id;
        art.content = art.content || '';
        art.pubDate = new Date(art.pubTime);
        
        art.tags = mapTagIdsToTags(art.tags);
        
        art.setIsRead = function (newIsRead) {
            var deferred = Q.defer();
            
            this.isRead = newIsRead;
            var that = this;
            articlesStorage.setArticleReadState(this.guid, newIsRead)
            .then(function () {
                return recountUnread(that.feed.url);
            })
            .then(function () {
                $rootScope.$broadcast('articleReadStateChanged', art);
                deferred.resolve();
            });
            
            return deferred.promise;
        };
        
        art.toggleTag = function (tagId) {
            var deferred = Q.defer();
            
            var promise;
            if (hasTag(art, tagId)) {
                promise = articlesStorage.untagArticle(art.guid, tagId);
            } else {
                promise = articlesStorage.tagArticle(art.guid, tagId);
            }
            promise.then(function (article) {
                art.tags = mapTagIdsToTags(article.tags);
                $rootScope.$broadcast('articleTagsChanged', art);
                deferred.resolve();
            });
            
            return deferred.promise;
        };
        
        art.addNewTag = function (tagName) {
            var deferred = Q.defer();
            
            addTag(tagName)
            .then(function (addedTag) {
                return articlesStorage.tagArticle(art.guid, addedTag._id);
            })
            .then(function (article) {
                art.tags = mapTagIdsToTags(article.tags);
                $rootScope.$broadcast('articleTagsChanged', art);
                deferred.resolve();
            });
            
            return deferred.promise;
        }
        
        art.feed = feedsService.getFeedByUrl(art.feedUrl);
    }
    
    //-----------------------------------------------------
    // Init
    //-----------------------------------------------------
    
    reloadTags();
    
    feedsService.feeds.map(function (feed) {
        recountUnread(feed.url);
    });
    
    //-----------------------------------------------------
    // API methods
    //-----------------------------------------------------
    
    function digest(feedUrl, harvestedArticles) {
        return articlesStorage.digest(feedUrl, harvestedArticles)
        .then(function () {
            return recountUnread(feedUrl);
        });
    }
    
    function getArticles(feedUrls, from, to, options) {
        var deferred = Q.defer();
        
        articlesStorage.getArticles(feedUrls, from, to, options)
        .then(function (result) {
            result.articles.forEach(decorateArticle);
            deferred.resolve(result);
        })
        .catch(function (err) {
            console.log(err)
        });
        
        return deferred.promise;
    }
    
    function markAllAsReadInFeeds(feedUrls) {
        return articlesStorage.markAllAsRead(feedUrls)
        .then(function () {
            return Q.all(feedUrls.map(function (feedUrl) {
                return recountUnread(feedUrl);
            }));
        });
    }
    
    function addTag(name) {
        var deferred = Q.defer();
        
        articlesStorage.addTag(name)
        .then(function (tag) {
            reloadTags()
            .then(function () {
                deferred.resolve(getTag(tag._id));
            });
        });
        
        return deferred.promise;
    }
    
    return  {
        get dbSize() {
            return articlesStorage.getDbSize();
        },
        
        digest: digest,
        
        getArticles: getArticles,
        markAllAsReadInFeeds: markAllAsReadInFeeds,
        removeAllForFeed: articlesStorage.removeAllForFeed,
        removeOlderThan: articlesStorage.removeOlderThan,
        
        get allTags() {
            return tags || [];
        },
        addTag: addTag,
    };
}