'use strict';

var Datastore = require('nedb');
var Q = require('q');

exports.make = function (dbPath) {
    
    var db = new Datastore({
        filename : dbPath,
        autoload: true
    });
    
    db.ensureIndex({ fieldName: 'feedUrl' });
    
    var digestInProgress;
    
    function indexOfArticle(list, article) {
        var guid = article.guid || article.link;
        for (var i = 0; i < list.length; i += 1) {
            if (list[i].guid === guid) {
                return i;
            }
        }
        return null;
    }
    
    function digestFeed(feedUrl, articles) {
        var deferred = Q.defer();
        var totalOperations = 0;
        var completedOperations = 0;
        
        function operationTick() {
            completedOperations += 1;
            if (totalOperations === completedOperations) {
                deferred.resolve();
            }
        }
        
        function getGuid(parsedArticle) {
            // if guid not specified use link as guid
            return parsedArticle.guid || parsedArticle.link;
        }
        
        var newArticlesGuids = articles.map(getGuid);
        
        // get from database all not abandoned articles for this feed
        db.find({ $or: [
            { feedUrl: feedUrl, isAbandoned: false },
            { guid: { $in: newArticlesGuids } },
        ] }, function (err, storedArticles) {
            
            var newArticles = [];
            // now iterate through new articles and add only new ones
            articles.forEach(function (article) {
                
                var index = indexOfArticle(storedArticles, article);
                if (typeof index === 'number') {
                    // this article already exists in database
                    var storedArt = storedArticles.splice(index, 1)[0];
                    // update article content and title if changed
                    if (storedArt.title !== article.title || storedArt.content !== article.description) {
                        totalOperations += 1;
                        db.update({ guid: storedArt.guid }, { $set: { title: article.title, content: article.description } }, {}, operationTick);
                    }
                } else {
                    
                    // this is new article, not yet in database
                    
                    // specify publication date
                    var pubTime;
                    if (article.pubDate) {
                        pubTime = article.pubDate.getTime();
                    } else {
                        // RSS cpec doesn't require for publication date to be specified,
                        // so we use the moment article was first time fetched as its pubDate.
                        pubTime = Date.now();
                    }
                    
                    // create article document and save it
                    var art = {
                        feedUrl: feedUrl,
                        link: article.link,
                        guid: getGuid(article),
                        title: article.title,
                        content: article.description,
                        pubTime: pubTime,
                        isRead: false,
                        isAbandoned: false
                    };
                    if (article.enclosures) {
                        art.enclosures = [];
                        article.enclosures.forEach(function (enclosure) {
                            if (enclosure.url && enclosure.type === 'audio/mpeg') {
                                art.enclosures.push({
                                    url: enclosure.url,
                                    type: enclosure.type
                                });
                            }
                        });
                    }
                    
                    newArticles.push(art);
                }
                
            });
            
            if (newArticles.length > 0) {
                totalOperations += 1;
                db.insert(newArticles, operationTick);
            }
            
            // Here we have in storedArticles only articles
            // which should be marked as abandoned.
            // Article isAbandoned if no longer appears on feed's xml.
            if (storedArticles.length > 0) {
                var articlesGuids = [];
                storedArticles.forEach(function (article) {
                    if (!article.isAbandoned) {
                        articlesGuids.push(article.guid);
                    }
                });
                totalOperations += 1;
                db.update({ guid: { $in: articlesGuids } }, { $set: { isAbandoned: true } }, { multi: true }, operationTick);
            }
            
            if (totalOperations === 0) {
                // no new article in feed, return immediately
                deferred.resolve();
            }
            
        });
        
        return deferred.promise;
    }
    
    function digest(feedUrl, harvestedArticles) {
        var digestPromise = Q.defer();
        
        if (!harvestedArticles || harvestedArticles.length === 0) {
            digestPromise.reject();
            return digestPromise.promise;
        }
        
        function doDigest() {
            digestInProgress = digestPromise.promise;
            digestFeed(feedUrl, harvestedArticles)
            .then(function () {
                digestInProgress = null;
                digestPromise.resolve();
            });
        }
        
        // for database cohesion only one digest can run at a time
        if (digestInProgress) {
            digestInProgress.then(doDigest);
        } else {
            doDigest();
        }
        
        return digestPromise.promise;
    }
    
    function getArticles(feedUrls, from, to, options) {
        var deferred = Q.defer();
        
        if (!Array.isArray(feedUrls)) {
            feedUrls = [feedUrls];
        }
        
        var query = { feedUrl: { $in: feedUrls } };
        
        if (options && options.tagId) {
            query.tags = options.tagId;
        }
        
        db.find(query, function (err, docs) {
            
            // sort chronologically
            docs.sort(function (a, b) {
                return b.pubTime - a.pubTime;
            });
            
            var unreadBefore = 0;
            var unreadAfter = 0;
            var countMode = 'before';
            for (var i = 0; i < docs.length; i += 1) {
                if (i === from) {
                    countMode = 'gap';
                }
                if (i === to) {
                    countMode = 'after';
                }
                if (countMode === 'before' && !docs[i].isRead) {
                    unreadBefore += 1;
                }
                if (countMode === 'after' && !docs[i].isRead) {
                    unreadAfter += 1;
                }
            }
            
            deferred.resolve({
                articles: docs.slice(from, to),
                numAll: docs.length,
                unreadBefore: unreadBefore,
                unreadAfter: unreadAfter,
            });
        });
        
        return deferred.promise;
    }
    
    function setArticleReadState(guid, readState) {
        var deferred = Q.defer();
        
        db.update({ guid: guid }, { $set: { isRead: readState } }, { multi: true }, function (err, numReplaced) {
            deferred.resolve();
        });
        
        return deferred.promise;
    }
    
    function markAllAsRead(feedUrls) {
        var deferred = Q.defer();
        
        db.update({ feedUrl: { $in: feedUrls}, isRead: false }, { $set: { isRead: true } }, { multi: true }, function (err, numReplaced) {
            deferred.resolve();
        });
        
        return deferred.promise;
    }
    
    function countUnread(feedUrl) {
        var deferred = Q.defer();
        
        db.count({ feedUrl: feedUrl, isRead: false }, function (err, count) {
            deferred.resolve(count);
        });
        
        return deferred.promise;
    }
    
    function removeAllForFeed(feedUrl) {
        var deferred = Q.defer();
        
        db.remove({
            feedUrl: feedUrl
        }, {
            multi: true
        }, function (err, numRemoved) {
            deferred.resolve();
        });
        
        return deferred.promise;
    }
    
    function getDbSize() {
        var fs = require('fs');
        if (!dbPath || !fs.existsSync(dbPath)) {
            return 0;
        }
        return fs.statSync(dbPath).size;
    }
    
    function removeOlderThan(time, leaveTagged) {
        var deferred = Q.defer();
        
        var query = {
            $and: [
                { pubTime: { $lt: time } },
                { isAbandoned: true }
            ]
        };
        if (leaveTagged) {
            query.$and.push({ tags: { $exists: false } });
        }
        
        db.remove(query, {
            multi: true
        }, function (err, numRemoved) {
            deferred.resolve(numRemoved);
        });
        
        return deferred.promise;
    }
    
    //-----------------------------------------------------
    // Tags
    //-----------------------------------------------------
    
    function getTags() {
        var deferred = Q.defer();
        
        db.find({ type: 'tag' }, function (err, docs) {
            
            docs.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
            
            deferred.resolve(docs);
        });
        
        return deferred.promise;
    }
    
    function addTag(tagName) {
        var deferred = Q.defer();
        
        db.findOne({ type: 'tag', name: tagName }, function (err, doc) {
            if (doc) {
                deferred.resolve(doc);
            } else {
                db.insert({
                    type: 'tag',
                    name: tagName
                }, function (err, newDoc) {
                    deferred.resolve(newDoc);
                });
            }
        });
        
        return deferred.promise;
    }
    
    function changeTagName(tagId, name) {
        var deferred = Q.defer();
        
        db.update({ _id: tagId }, { $set: { name: name } }, {}, function () {
            deferred.resolve();
        });
        
        return deferred.promise;
    }
    
    function tagArticle(artGuid, tagId) {
        var deferred = Q.defer();
        
        db.update({ guid: artGuid }, { $addToSet: { tags: tagId } }, {}, function (err, numReplaced) {
            db.findOne({ guid: artGuid }, function (err, doc) {
                deferred.resolve(doc);
            });
        });
        
        return deferred.promise;
    }
    
    function untagArticle(artGuid, tagId) {
        var deferred = Q.defer();
        
        db.findOne({ guid: artGuid }, function (err, doc) {
            var replacement = { $set: { tags: doc.tags } };
            if (doc.tags) {
                var index = doc.tags.indexOf(tagId);
                doc.tags.splice(index, 1);
                if (doc.tags.length === 0) {
                    replacement = { $unset: { tags: true } };
                    doc.tags = undefined;
                }
            }
            db.update({ guid: artGuid }, replacement, {}, function (err) {
                deferred.resolve(doc);
            });
        });
        
        return deferred.promise;
    }
    
    function removeTag(tagId) {
        var deferred = Q.defer();
        
        db.update({ tags: tagId }, { $pull: { tags: tagId } }, { multi: true }, function (err, numReplaced) {
            db.remove({ _id: tagId }, {}, function (err, numRemoved) {
                deferred.resolve();
            }); 
        });
        
        return deferred.promise;
    }
    
    return {
        getDbSize: getDbSize,
        digest: digest,
        
        getArticles: getArticles,
        setArticleReadState: setArticleReadState,
        markAllAsRead: markAllAsRead,
        countUnread: countUnread,
        removeAllForFeed: removeAllForFeed,
        
        removeOlderThan: removeOlderThan,
        
        getTags: getTags,
        addTag: addTag,
        changeTagName: changeTagName,
        tagArticle: tagArticle,
        untagArticle: untagArticle,
        removeTag: removeTag,
    };
}