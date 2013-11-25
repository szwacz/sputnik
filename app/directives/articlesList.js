'use strict';

function articlesListDirective($sanitize, $rootScope) {
    
    var organizer = require('./helpers/articlesOrganizer');
    var fs = require('fs');
    var articleTemplate = fs.readFileSync('./views/read/article.html', { encoding: 'utf8' });
    
    var presentedArticles;
    
    //-----------------------------------------------------
    // Helper functions
    //-----------------------------------------------------
    
    function getArticleById(id) {
        for (var i = 0; i < presentedArticles.length; i += 1) {
            if (presentedArticles[i].id === id) {
                return presentedArticles[i];
            }
        }
        return null;
    }
    
    function getArticleForDomEvent(evt) {
        var ele = evt.target;
        while (ele.parentElement) {
            ele = ele.parentElement;
            if (ele.hasAttribute('id')) {
                return getArticleById(ele.getAttribute('id'));
            }
        }
        return null;
    }
    
    //-----------------------------------------------------
    // HTML rendering
    //-----------------------------------------------------
    
    function getDayLabelHtml(article) {
        return '<div class="articles-sheet__element  day-label">' + article.dayLabel + '</div>';
    }
    
    function getFeedInfoHtml(article) {
        var feedInfo = '';
        if (article.feed.favicon) {
            feedInfo += '<img src="' + article.feed.favicon + '" class="article__feed-icon"/>';
        } else {
            feedInfo += '<div class="article__feed-icon  article__feed-icon--none"></div>';
        }
        feedInfo += '<span class="article__feed-title"> ' + article.feed.title + '</span>';
        return feedInfo;
    }
    
    function getTagsHtml(article) {
        var articleTags = '';
        article.tags.forEach(function (tag) {
            articleTags += '<span class="article__tag-item">' + tag.name + '</span> ';
        });
        return articleTags;
    }
    
    function getArticleContentHtml(article) {
        var content = article.content;
        content = processHtml(content, article.link);
        try {
            content = $sanitize(content);
        } catch (err) {
            // if not sanitized, kill it as insecure
            content = 'Oops. Sorry, this article can\'t be displayed. <a href="' + article.link + '">See it in the browser.</a>';
        }
        return lazyLoadImages(content);
    }
    
    var cheerio = require('cheerio');
    var urlUtil = require('url');
    
    function processHtml(content, articleUrl) {
        var dom = cheerio.load(content);
        
        function flashPatch(i, elem) {
            var patchStr = '<div class="flash-patch"><a href="' + articleUrl + '">Here should be a <strong>video</strong> (probably),<br/>click to see it in the browser.</a></div>';
            dom(elem).replaceWith(patchStr);
        }
        
        dom('object').each(flashPatch);
        dom('iframe').each(flashPatch);
        
        return dom.html();
    }
    
    function lazyLoadImages(content) {
        var dom = cheerio.load(content);
        
        dom('img').each(function (i, elem) {
            var src = dom(elem).attr('src');
            if (src) {
                dom(elem).attr('data-lazy-src', src);
                dom(elem).removeAttr('src');
            }
        });
        
        return dom.html();
    }
    
    return {
        restrict: 'E',
        replace: true,
        template: '',
        scope: true,
        link: function ($scope, $element) {
            
            var articleTagsChangedWatcher = $rootScope.$on('articleTagsChanged', function (evt, article) {
                angular.element('#' + article.id + ' .js-article-tags')[0].innerHTML = getTagsHtml(article);
            });
            var articleReadStateChangedWatcher = $rootScope.$on('articleReadStateChanged', function (evt, article) {
                if (article.isRead) {
                    angular.element('#' + article.id).addClass('article--read');
                } else {
                    angular.element('#' + article.id).removeClass('article--read');
                }
            });
            
            $scope.$on('$destroy', function () {
                // prevent memory leaks
                articleTagsChangedWatcher();
                articleReadStateChangedWatcher();
            });
            
            function render() {
                presentedArticles = $scope.presentedArticles;
                organizer.organizeByDays(presentedArticles);
                
                // render template
                
                var html = '';
                
                presentedArticles.forEach(function (art) {
                    
                    if (art.dayLabel) {
                        html += getDayLabelHtml(art);
                    }
                    
                    var t = articleTemplate.replace('{{art.id}}', art.id);
                    if (art.isRead) {
                        t = t.replace('{{isReadClass}}', 'article--read');
                    } else {
                        t = t.replace('{{isReadClass}}', '');
                    }
                    t = t.replace('{{art.title}}', art.title);
                    t = t.replace(/\{\{art.link\}\}/g, art.link);
                    t = t.replace('{{articleContent}}', getArticleContentHtml(art));
                    t = t.replace('{{feedInfo}}', getFeedInfoHtml(art));
                    t = t.replace('{{articleTags}}', getTagsHtml(art));
                    
                    html += t;
                });
                
                $element.html(html);
                
                // add event bindings
                
                $element.find('.js-show-pick-tag-menu').click(function (evt) {
                    var article = getArticleForDomEvent(evt);
                    $scope.$emit('showPickTagMenu', article, evt.target);
                });
                
                $element.find('.js-toggle-is-read').click(function (evt) {
                    var article = getArticleForDomEvent(evt);
                    article.setIsRead(!article.isRead)
                    .then(function () {
                        
                    });
                });
            }
            
            $scope.$watch('presentedArticles', render);
            
            render();
        }
    };
}