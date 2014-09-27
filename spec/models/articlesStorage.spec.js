import articlesStorage from 'models/articlesStorage';

describe('articlesStorage', function () {
    
    // things in format returned by feedsHarvester
    var harvest1 = [
        {
            "title": "art3",
            "description": "description3",
            "link": "link3",
            "pubDate": new Date(3),
        },
        {
            "title": "art2",
            "description": "description2",
            "link": "link2",
            "guid": "guid2",
            "pubDate": new Date(2),
        },
        {
            "title": "art1",
            "description": "description1",
            "link": "link1",
            "pubDate": new Date(1),
            "enclosures": [
                {
                    "url": "audioUrl/1",
                    "type": "audio/mpeg",
                    "length": "123"
                },
                {
                    "url": "audioUrl/2",
                    "type": "something",
                    "length": "456"
                },
                {
                    "type": "lackOfUrl",
                    "length": "456"
                }
            ]
        }
    ];
    var harvest2 = [
        {
            "title": "art4",
            "description": "description4",
            "link": "link4",
            "pubDate": new Date(4),
        },
        {
            "title": "art3",
            "description": "description3",
            "link": "link3",
            "pubDate": new Date(3),
        },
        {
            "title": "art2",
            "description": "description2",
            "link": "link2",
            "guid": "guid2",
            "pubDate": new Date(2),
        }
    ];
    var harvest3 = [
        {
            "title": "art4",
            "description": "description4",
            "link": "link4",
            "pubDate": new Date(4),
        },
        {
            "title": "art2",
            "description": "description2",
            "link": "link2",
            "guid": "guid2",
            "pubDate": new Date(2),
        }
    ];
    var harvestNoPubDate = [
        {
            "title": "art4",
            "description": "description4",
            "link": "link4"
        }
    ];
    
    var getArt = function (list, guid) {
        for (var i = 0; i < list.length; i += 1) {
            if (list[i].guid === guid) {
                return list[i];
            }
        }
        return null;
    };
    
    it('should digest data from feedsHarvester and store them', function (done) {
        var as = articlesStorage.make();
        as.digest('a.com/feed', harvest1)
        .then(function () {
            return as.getArticles(['a.com/feed'], 0, 100);
        })
        .then(function (result) {
            var articles = result.articles;
            expect(articles.length).toBe(3);
            
            var art = getArt(articles, 'link1');
            expect(art.guid).toBe('link1');
            expect(art.title).toBe('art1');
            expect(art.content).toBe('description1');
            expect(art.pubTime).toBe(1);
            expect(art.isRead).toBe(false);
            
            art = getArt(articles, 'guid2');
            expect(art.guid).toBe('guid2');
            expect(art.pubTime).toBe(2);
            expect(art.isRead).toBe(false);
            
            art = getArt(articles, 'link3');
            expect(art.guid).toBe('link3');
            expect(art.title).toBe('art3');
            expect(art.content).toBe('description3');
            expect(art.pubTime).toBe(3);
            expect(art.isRead).toBe(false);
            
            done();
        });
    });
    
    it('should paginate results, sorted: 0-newest, last-oldest', function (done) {
        var as = articlesStorage.make();
        as.digest('a.com/feed', harvest1)
        .then(function () {
            return as.getArticles('a.com/feed', 0, 3);
        })
        .then(function (result) {
            expect(result.articles.length).toBe(3);
            expect(result.numAll).toBe(3);
            expect(result.articles[0].guid).toBe('link3');
            expect(result.articles[1].guid).toBe('guid2');
            expect(result.articles[2].guid).toBe('link1');
            
            return as.getArticles('a.com/feed', 1, 3);
        })
        .then(function (result) {
            expect(result.articles.length).toBe(2);
            expect(result.articles[0].guid).toBe('guid2');
            expect(result.articles[1].guid).toBe('link1');
            
            return as.getArticles('a.com/feed', 1, 2);
        })
        .then(function (result) {
            expect(result.articles.length).toBe(1);
            expect(result.articles[0].guid).toBe('guid2');
            
            done();
        });
    });
    
    it('should not duplicate same articles when digested many times', function (done) {
        var as = articlesStorage.make();
        as.digest('a.com/feed', harvest1)
        .then(function () {
            return as.digest('a.com/feed', harvest2);
        })
        .then(function () {
            return as.getArticles(['a.com/feed'], 0, 100);
        })
        .then(function (result) {
            var articles = result.articles;
            expect(articles.length).toBe(4);
            expect(getArt(articles, 'link4')).not.toBeNull();
            expect(getArt(articles, 'link3')).not.toBeNull();
            expect(getArt(articles, 'guid2')).not.toBeNull();
            expect(getArt(articles, 'link1')).not.toBeNull();
            
            done();
        });
    });
    
    it('should update article title or content if has changed in xml', function (done) {
        var as = articlesStorage.make();
        as.digest('a.com/feed', harvest1)
        .then(function () {
            return as.digest('a.com/feed', [{
                // same article as digested earlier, but with changed content
                "title": "different title",
                "description": "different description",
                "link": "link3",
                "pubDate": new Date(3),
            }]);
        })
        .then(function () {
            return as.getArticles(['a.com/feed'], 0, 100);
        })
        .then(function (result) {
            var art = getArt(result.articles, 'link3');
            expect(art.title).toBe('different title');
            expect(art.content).toBe('different description');
            
            done();
        });
    });
    
    it('should do fine when 2 digest jobs were executed simultaneously', function (done) {
        var doneTasks = 0;
        var ticDone = function () {
            doneTasks += 1;
            if (doneTasks === 2) {
                done();
            }
        };
        var as = articlesStorage.make();
        
        as.digest('a.com/feed', harvest1)
        .then(function () {
            return as.getArticles(['a.com/feed'], 0, 100);
        })
        .then(function (result) {
            expect(result.articles.length).toBe(3);
            ticDone();
        });
        
        as.digest('a.com/feed', harvest1)
        .then(function () {
            return as.getArticles(['a.com/feed'], 0, 100);
        })
        .then(function (result) {
            expect(result.articles.length).toBe(3);
            ticDone();
        });
    });
    
    it('should mark articles which not appear in feeds xml anymore as abandoned', function (done) {
        var as = articlesStorage.make();
        as.digest('a.com/feed', harvest1)
        .then(function () {
            return as.digest('a.com/feed', harvest2);
        })
        .then(function () {
            return as.getArticles(['a.com/feed'], 0, 100);
        })
        .then(function (result) {
            var articles = result.articles;
            expect(getArt(articles, 'link4').isAbandoned).toBe(false);
            expect(getArt(articles, 'link3').isAbandoned).toBe(false);
            expect(getArt(articles, 'guid2').isAbandoned).toBe(false);
            expect(getArt(articles, 'link1').isAbandoned).toBe(true);
            
            done();
        });
    });
    
    it('should not mark as abandoned if empty list of articles provided', function (done) {
        var as = articlesStorage.make();
        as.digest('a.com/feed', harvest1)
        .then(function () {
            return as.digest('a.com/feed', []);
        })
        .then(null, function () {
            return as.getArticles(['a.com/feed'], 0, 100);
        })
        .then(function (result) {
            expect(getArt(result.articles, 'link3').isAbandoned).toBe(false);
            expect(getArt(result.articles, 'guid2').isAbandoned).toBe(false);
            expect(getArt(result.articles, 'link1').isAbandoned).toBe(false);
            done();
        });
    });
    
    it('if article reappeared in feed after some time merge it in DB with old one', function (done) {
        var as = articlesStorage.make();
        as.digest('a.com/feed', [{
            title: "art",
            description: "description",
            link: "link",
            pubDate: new Date(1),
        }])
        .then(function () {
            return as.digest('a.com/feed', [{
                title: "art",
                description: "description",
                link: "link-other",
                pubDate: new Date(2),
            }]);
        })
        .then(function () {
            return as.digest('a.com/feed', [{
                title: "art-again",
                description: "description-again",
                link: "link", // same as 2 digests ago
                pubDate: new Date(3),
            }]);
        })
        .then(function () {
            return as.getArticles(['a.com/feed'], 0, 100);
        })
        .then(function (result) {
            expect(result.articles.length).toBe(2);
            
            expect(result.articles[0].guid).toBe('link-other');
            
            expect(result.articles[1].guid).toBe('link');
            expect(result.articles[1].title).toBe('art-again'); // title should be updated
            expect(result.articles[1].content).toBe('description-again'); // description should be updated
            expect(result.articles[1].pubTime).toBe(1); // pubTime of first article should be preserved
            
            done();
        });
    });
    
    it('should mark article as read', function (done) {
        var as = articlesStorage.make();
        as.digest('a.com/feed', harvest1)
        .then(function () {
            return as.setArticleReadState('guid2', true);
        })
        .then(function () {
            return as.getArticles(['a.com/feed'], 0, 100);
        })
        .then(function (result) {
            var articles = result.articles;
            expect(getArt(articles, 'link3').isRead).toBe(false);
            expect(getArt(articles, 'guid2').isRead).toBe(true);
            expect(getArt(articles, 'link1').isRead).toBe(false);
            
            done();
        });
    });
    
    it('should count unread articles for given feed', function (done) {
        var as = articlesStorage.make();
        as.digest('a.com/feed', harvest1)
        .then(function () {
            return as.countUnread('a.com/feed');
        })
        .then(function (count) {
            expect(count).toBe(3);
            return as.setArticleReadState('guid2', true);
        })
        .then(function () {
            return as.countUnread('a.com/feed');
        })
        .then(function (count) {
            expect(count).toBe(2);
            done();
        });
    });
    
    it('should set "now" date for article if pubDate was not provided in feed xml', function (done) {
        var as = articlesStorage.make();
        as.digest('a.com/feed', harvestNoPubDate)
        .then(function () {
            return as.getArticles(['a.com/feed'], 0, 100);
        })
        .then(function (result) {
            var articles = result.articles;
            var now = Date.now();
            // now with 1 second toleration for test to pass
            expect(articles[0].pubTime).toBeGreaterThan(now - 500);
            expect(articles[0].pubTime).toBeLessThan(now + 500);
            
            done();
        });
    });
    
    it('should parse audio enclosures', function (done) {
        var as = articlesStorage.make();
        as.digest('a.com/feed', harvest1)
        .then(function () {
            return as.getArticles(['a.com/feed'], 0, 100);
        })
        .then(function (result) {
            var articles = result.articles;
            var art = getArt(articles, 'link1');
            // should have one enclosure, the second one is of different type
            expect(art.enclosures.length).toBe(1);
            expect(art.enclosures[0].url).toBe('audioUrl/1');
            expect(art.enclosures[0].type).toBe('audio/mpeg');
            
            art = getArt(articles, 'guid2');
            // if no enclosures specified this field should be undefined
            expect(art.enclosures).toBe(undefined);
            
            done();
        });
    });
    
    it('should remove all articles of given feed', function (done) {
        var as = articlesStorage.make();
        as.digest('a.com/feed', harvest1)
        .then(function () {
            return as.removeAllForFeed('a.com/feed');
        })
        .then(function () {
            return as.getArticles(['a.com/feed'], 0, 100);
        })
        .then(function (result) {
            expect(result.articles.length).toBe(0);
            expect(result.numAll).toBe(0);
            
            done();
        });
    });
    
    it('should count unread articles for feed', function (done) {
        var as = articlesStorage.make();
        as.digest('a.com/feed', harvest1)
        .then(function () {
            return as.countUnread('a.com/feed');
        })
        .then(function (count) {
            expect(count).toBe(3);
            done();
        });
    });
    
    it('getArticles should tell how much unread articles not visible on current page', function (done) {
        var as = articlesStorage.make();
        as.digest('a.com/feed', harvest1)
        .then(function () {
            return as.digest('a.com/feed', harvest2);
        })
        .then(function () {
            return as.setArticleReadState('link1', true);
        })
        .then(function () {
            return as.getArticles(['a.com/feed'], 1, 2);
        })
        .then(function (result) {
            expect(result.unreadBefore).toBe(1);
            expect(result.unreadAfter).toBe(1);
        })
        .then(function () {
            return as.getArticles(['a.com/feed'], 0, 5);
        })
        .then(function (result) {
            expect(result.unreadBefore).toBe(0);
            expect(result.unreadAfter).toBe(0);
        })
        .then(function () {
            return as.markAllAsRead(['a.com/feed']);
        })
        .then(function () {
            return as.getArticles(['a.com/feed'], 1, 2);
        })
        .then(function (result) {
            expect(result.unreadBefore).toBe(0);
            expect(result.unreadAfter).toBe(0);
            done();
        });
    });
    
    describe('tagging', function () {
        
        it('should add tag', function (done) {
            var as = articlesStorage.make();
            as.addTag('tag1')
            .then(function (addedTag) {
                expect(addedTag._id).toBeDefined();
                expect(addedTag.name).toBe('tag1');
                return as.getTags();
            })
            .then(function (tags) {
                expect(tags.length).toBe(1);
                expect(tags[0]._id).toBeDefined();
                expect(tags[0].name).toBe('tag1');
                done();
            });
        });
        
        it('should not add 2 tags with the same name', function (done) {
            var as = articlesStorage.make();
            var tag1;
            as.addTag('tag1')
            .then(function (addedTag) {
                tag1 = addedTag;
                return as.addTag('tag1');
            })
            .then(function (addedTag) {
                // should return already existing tag object
                expect(tag1._id).toBe(addedTag._id);
                return as.getTags();
            })
            .then(function (tags) {
                expect(tags.length).toBe(1);
                expect(tags[0]._id).toBe(tag1._id);
                done();
            });
        });
        
        it('should tag and untag articles', function (done) {
            var as = articlesStorage.make();
            var tag1;
            var tag2;
            as.digest('a.com/feed', harvest1)
            .then(function () {
                return as.addTag('tag1');
            })
            .then(function (addedTag) {
                tag1 = addedTag;
                return as.addTag('tag2');
            })
            .then(function (addedTag) {
                tag2 = addedTag;
                return as.tagArticle('link3', tag1._id);
            })
            .then(function (taggedArticle) {
                return as.untagArticle('link3', tag1._id);
            })
            .then(function (untaggedArticle) {
                expect(untaggedArticle.guid).toBe('link3');
                expect(untaggedArticle.tags).toBe(undefined);
                return as.tagArticle('link3', tag1._id);
            })
            .then(function (taggedArticle) {
                return as.getArticles(['a.com/feed'], 0, 100);
            })
            .then(function (result) {
                var art = getArt(result.articles, 'link3');
                expect(art.tags.length).toBe(1);
                return as.tagArticle('link3', tag2._id);
            })
            .then(function (taggedArticle) {
                return as.getArticles(['a.com/feed'], 0, 100);
            })
            .then(function (result) {
                var art = getArt(result.articles, 'link3');
                expect(art.tags.length).toBe(2);
                return as.untagArticle('link3', tag1._id);
            })
            .then(function (untaggedArticle) {
                expect(untaggedArticle.guid).toBe('link3');
                expect(untaggedArticle.tags.length).toBe(1);
                expect(untaggedArticle.tags[0]).toBe(tag2._id);
                return as.getArticles(['a.com/feed'], 0, 100);
            })
            .then(function (result) {
                var art = getArt(result.articles, 'link3');
                expect(art.tags.length).toBe(1);
                expect(art.tags[0]).toBe(tag2._id);
                done();
            });
        });
        
        it('should not tag article twice with same tag', function (done) {
            var as = articlesStorage.make();
            var tag1;
            as.digest('a.com/feed', harvest1)
            .then(function () {
                return as.addTag('tag1');
            })
            .then(function (addedTag) {
                tag1 = addedTag;
                return as.tagArticle('link3', tag1._id);
            })
            .then(function (taggedArticle) {
                return as.tagArticle('link3', tag1._id);
            })
            .then(function (taggedArticle) {
                expect(taggedArticle.tags.length).toBe(1);
                done();
            });
        });
        
        it('should list all articles with given tag', function (done) {
            var as = articlesStorage.make();
            var tag1;
            as.digest('a.com/feed', harvest1)
            .then(function () {
                return as.addTag('tag1');
            })
            .then(function (addedTag) {
                tag1 = addedTag;
                return as.tagArticle('link3', tag1._id);
            })
            .then(function (taggedArticle) {
                return as.tagArticle('link1', tag1._id);
            })
            .then(function (taggedArticle) {
                return as.getArticles(['a.com/feed'], 0, 100, {
                    tagId: tag1._id
                });
            })
            .then(function (result) {
                expect(result.articles.length).toBe(2);
                expect(result.articles[0].guid).toBe('link3');
                expect(result.articles[1].guid).toBe('link1');
                done();
            });
        });
        
        it('should remove tag', function (done) {
            var as = articlesStorage.make();
            var tag1;
            as.digest('a.com/feed', harvest1)
            .then(function () {
                return as.addTag('tag1');
            })
            .then(function (addedTag) {
                tag1 = addedTag;
                return as.removeTag(tag1._id);
            })
            .then(function () {
                return as.getTags();
            })
            .then(function (tags) {
                expect(tags.length).toBe(0);
                done();
            });
        });
        
        it('should remove tag, and its reference from articles', function (done) {
            var as = articlesStorage.make();
            var tag1;
            as.digest('a.com/feed', harvest1)
            .then(function () {
                return as.addTag('tag1');
            })
            .then(function (addedTag) {
                tag1 = addedTag;
                return as.tagArticle('link3', tag1._id);
            })
            .then(function (taggedArticle) {
                return as.tagArticle('link1', tag1._id);
            })
            .then(function (taggedArticle) {
                return as.removeTag(tag1._id);
            })
            .then(function () {
                return as.getTags();
            })
            .then(function (tags) {
                expect(tags.length).toBe(0);
                return as.getArticles(['a.com/feed'], 0, 100, {
                    tagId: tag1._id
                });
            })
            .then(function (result) {
                expect(result.articles.length).toBe(0);
                done();
            });
        });
        
        it('should change tag name', function (done) {
            var as = articlesStorage.make();
            var tag1;
            as.addTag('tag1')
            .then(function (addedTag) {
                tag1 = addedTag;
                return as.changeTagName(tag1._id, 'new name');
            })
            .then(function () {
                return as.getTags();
            })
            .then(function (tags) {
                expect(tags.length).toBe(1);
                expect(tags[0].name).toBe('new name');
                done();
            });
        });
        
    });
    
    describe('cleaning database', function () {
        
        it('should remove abandoned articles older than X', function (done) {
            var as = articlesStorage.make();
            var tag1;
            as.digest('a.com/feed', harvest1)
            .then(function () {
                return as.digest('a.com/feed', harvest3);
                // articles link1, link3 should now be abandoned
            })
            .then(function () {
                return as.addTag('tag1');
            })
            .then(function (addedTag) {
                tag1 = addedTag;
                // should remove even tagged article
                return as.tagArticle('link1', tag1._id);
            })
            .then(function () {
                return as.removeOlderThan(4, false);
            })
            .then(function () {
                return as.getArticles(['a.com/feed'], 0, 100);
            })
            .then(function (result) {
                expect(result.numAll).toBe(2);
                expect(result.articles[0].guid).toBe('link4');
                expect(result.articles[1].guid).toBe('guid2'); // should stay because is not abandoned
                done();
            });
        });
        
        it('if option set, should not remove tagged articles even if other conditions met', function (done) {
            var as = articlesStorage.make();
            var tag1;
            as.digest('a.com/feed', harvest1)
            .then(function () {
                return as.digest('a.com/feed', harvest3);
                // articles link1, link3 should now be abandoned
            })
            .then(function () {
                return as.addTag('tag1');
            })
            .then(function (addedTag) {
                tag1 = addedTag;
                return as.tagArticle('link1', tag1._id);
            })
            .then(function () {
                return as.tagArticle('link3', tag1._id);
            })
            .then(function () {
                // was tagged and untagged, so should be deleted as well
                return as.untagArticle('link3', tag1._id);
            })
            .then(function () {
                return as.removeOlderThan(4, true);
            })
            .then(function () {
                return as.getArticles(['a.com/feed'], 0, 100);
            })
            .then(function (result) {
                expect(result.numAll).toBe(3);
                expect(result.articles[0].guid).toBe('link4');
                expect(result.articles[1].guid).toBe('guid2'); // should stay because is not abandoned
                expect(result.articles[2].guid).toBe('link1'); // should stay because has tag
                done();
            });
        });
        
    });
    
});