'use strict';

function ReadCtrl($scope, $window, feedsService, articlesService, downloadService, config) {
    
    var Q = require('q');
    
    var pageIndex = 0;
    var articlesPerPage = config.articlesPerPage;
    var presentedArticles = [];
    var returningFromPrevPage = false;
    $scope.unreadBeforeThisPage = 0;
    $scope.unreadAfterThisPage = 0;
    
    var articlesList = angular.element(".js-articles-list");
    
    function downloadFeeds() {
        if (feedsService.feeds.length === 0 || downloadService.isWorking) {
            return;
        }
        
        downloadService.download()
        .then(showArticles,
        function (failMessage) {
            if (failMessage === 'No connection') {
                $scope.$emit('showNotification', "I couldn't load new articles. It looks like there is no internet connection.");
            }
            showArticles();
        },
        function (progress) {
            var ratio = Math.round(progress.completed / progress.total * 100);
            angular.element('.refreshing__progress-bar').css('width', ratio + '%');
        });
        
        $scope.state = 'refreshing';
        angular.element('.refreshing__progress-bar').css('width', '0%');
    }
    
    function showArticles() {
        
        // if some scrolling is going on kill it
        if (scrollInterval !== undefined) {
            breakScrollLoop();
        }
        
        var from = pageIndex * articlesPerPage;
        var to = from + articlesPerPage;
        
        var feedUrls;
        if ($scope.selectedCategory.type === 'feed') {
            feedUrls = [$scope.selectedCategory.url];
        } else {
            feedUrls = $scope.selectedCategory.feeds.map(function (feed) {
                return feed.url;
            });
        }
        
        var options = {};
        if ($scope.selectedTag) {
            options.tagId = $scope.selectedTag._id;
        }
        
        articlesService.getArticles(feedUrls, from, to, options)
        .then(function (result) {
            $scope.isPrevPage = (from > 0);
            $scope.isNextPage = (to <= result.numAll);
            
            $scope.unreadBeforeThisPage = result.unreadBefore;
            $scope.unreadAfterThisPage = result.unreadAfter;
            
            renderArticles(result.articles);
        });
    }
    
    function renderArticles(articles) {
        presentedArticles = articles;
        $scope.presentedArticles = presentedArticles;
        $scope.state = 'articles';
        
        $scope.$apply();
        
        // set page scroll at proper place
        if (returningFromPrevPage) {
            returningFromPrevPage = false;
            articlesList.scrollTop(articlesList[0].scrollHeight);
        } else {
            articlesList.scrollTop(0);
        }
        
        // load visible images
        lazyLoadImages();
    }
    
    function markAllAsRead() {
        var promises = [];
        presentedArticles.forEach(function (art) {
            if (!art.isRead) {
                promises.push(art.setIsRead(true));
            }
        });
        Q.all(promises)
        .then(function () {
            // above code changes to read only articles on this side
            // this code marks as read everything on other pages of this list
            var feedUrls;
            if ($scope.selectedCategory.type === 'feed') {
                feedUrls = [$scope.selectedCategory.url];
            } else {
                feedUrls = $scope.selectedCategory.feeds.map(function (feed) {
                    return feed.url;
                });
            }
            return articlesService.markAllAsReadInFeeds(feedUrls);
        })
        .then(function () {
            $scope.unreadBeforeThisPage = 0;
            $scope.unreadAfterThisPage = 0;
            $scope.$apply();
        });
    }
    
    $scope.feedsTree = feedsService.tree;
    $scope.all = feedsService;
    $scope.presentedArticles = [];
    
    $scope.refresh = downloadFeeds;
    $scope.markAllAsRead = markAllAsRead;
    
    // could be any element of feedsService.tree
    $scope.selectedCategory = $scope.all;
    $scope.selectCategory = function (cat) {
        $scope.selectedCategory = cat;
        pageIndex = 0;
        if ($scope.state !== 'noFeeds' && $scope.state !== 'refreshing') {
            showArticles();
        }
    };
    
    $scope.onTagSelected = function () {
        pageIndex = 0;
        showArticles();
    };
    
    $scope.prevPage = function () {
        if ($scope.isPrevPage) {
            pageIndex -= 1;
            returningFromPrevPage = true;
            showArticles();
        }
    };
    
    $scope.nextPage = function () {
        if ($scope.isNextPage) {
            pageIndex += 1;
            showArticles();
        }
    };
    
    $scope.$on('articleReadStateChanged', function () {
        checkIfAllRead();
        // needed to update unreadArticlesCount, which was recounted automaticly
        // but scope doesn't know it happened
        $scope.$apply();
    });
    
    function checkIfAllRead() {
        if ($scope.selectedCategory.unreadArticlesCount === 0) {
            var msg = 'Everything read.';
            if ($scope.selectedCategory.type === 'category') {
                msg = 'Everything read in this category.';
            } else if ($scope.selectedCategory.type === 'feed') {
                msg = 'Everything read in this feed.';
            }
            $scope.$emit('showNotification', msg);
        }
    }
    
    $scope.$on('unreadArticlesRecounted', function () {
        $scope.$apply();
    });
    
    //-----------------------------------------------------
    // Initial actions
    //-----------------------------------------------------
    
    if (feedsService.feeds.length === 0) {
        $scope.state = 'noFeeds';
    } else if ($scope.$parent.lastSignificantEvent === 'appJustStarted' ||
               $scope.$parent.lastSignificantEvent === 'feedAdded' ||
               $scope.$parent.lastSignificantEvent === 'feedsImported') {
        downloadFeeds();
        $scope.$parent.lastSignificantEvent = null;
    } else {
        showArticles();
    }
    
    //-----------------------------------------------------
    // Tags menu
    //-----------------------------------------------------
    
    $scope.showPickTagMenuData = null;
    
    $scope.$on('showPickTagMenu', function (evt, article, clickedElement) {
        $scope.showPickTagMenuData = {
            article: article,
            clickedElement: clickedElement
        };
        $scope.$apply();
    });
    
    $scope.$on('hidePickTagMenu', function (evt) {
        $scope.showPickTagMenuData = null;
        $scope.$apply();
    });
    
    //-----------------------------------------------------
    // Lazy load images
    //-----------------------------------------------------
    
    var autoScrolling = false;
    
    function lazyLoadImages() {
        if (autoScrolling) {
            // we don't want to load images while autoScrolling,
            // because height of loaded image can raise from 0 to X pixels
            // and it messes with point in page we are scrolling to
            return;
        }
        angular.element('img[data-lazy-src]').each(function (i, elem) {
            var currScroll = angular.element(".js-articles-list").scrollTop();
            var range = $window.outerHeight * 5;
            if (elem.offsetTop >= currScroll &&
                elem.offsetTop < currScroll + range) {
                var jqElem = angular.element(elem);
                var src = jqElem.attr('data-lazy-src');
                jqElem.attr('src', src);
                jqElem.removeAttr('data-lazy-src');
            }
        });
    }
    
    articlesList.scroll(lazyLoadImages);
    
    //-----------------------------------------------------
    // Key bindings
    //-----------------------------------------------------
    
    function keyDownBindings(event) {
        if ($scope.state !== 'articles' ||
            document.activeElement.tagName.toLowerCase() === 'input') {
            return;
        }
        switch (event.keyCode) {
            // up
            case 38:
                scrollTo('-1');
                event.preventDefault();
                break;
            // down
            case 40:
                scrollTo('+1');
                event.preventDefault();
                break;
            // space
            case 32:
                //just prevent default behaviour, to not allow to scroll by space
                event.preventDefault();
                break;
        }
    }
    
    function keyUpBindings(event) {
        if ($scope.state !== 'articles' ||
            document.activeElement.tagName.toLowerCase() === 'input') {
            return;
        }
        switch (event.keyCode) {
            // left
            case 37:
                if (event.ctrlKey) {
                    $scope.prevPage();
                } else {
                    scrollTo('prev');
                }
                event.preventDefault();
                break;
            // right
            case 39:
                if (event.ctrlKey) {
                    $scope.nextPage();
                } else {
                    scrollTo('next');
                }
                event.preventDefault();
                break;
            // space
            case 32:
                markFirstAsReadAndScrollToNext();
                event.preventDefault();
                break;
            // enter
            case 13:
                markAllAsRead();
                event.preventDefault();
                break;
        }
    }
    
    document.addEventListener('keydown', keyDownBindings, false);
    document.addEventListener('keyup', keyUpBindings, false);
    
    $scope.$on('$destroy', function () {
        document.removeEventListener('keydown', keyDownBindings, false);
        document.removeEventListener('keyup', keyUpBindings, false);
    });
    
    //-----------------------------------------------------
    // Scrolling to articles
    //-----------------------------------------------------
    
    var currScrollPos;
    var targetScrollPos;
    var scrollInterval;
    
    /**
     * Checks if any part of given article is visible on screen.
     */
    function articleVisibleInViewport(article) {
        var el = angular.element('#' + article.id);
        var bounds = el[0].getBoundingClientRect();
        // neglect bottom part of article to not confuse if really tiny amount of article visible
        var boundBottom = bounds.bottom - (el.find('.js-article-actions').height() / 2);
        // finding out if not visible is easier than finding if visible
        var notVisible = boundBottom < 0 || bounds.top > articlesList.height();
        return !notVisible;
    }
    
    /**
     * Returns first article from top which is partially visible on screen.
     */
    function getFirstVisibleArticle() {
        for (var i = 0; i < presentedArticles.length; i += 1) {
            if (articleVisibleInViewport(presentedArticles[i])) {
                break;
            }
        }
        return presentedArticles[i];
    }
    
    /**
     * Returns next or previous neighbour to given article;
     */
    function getArticleNeighbour(what, referenceArticle) {
        for (var i = 0; i < presentedArticles.length; i += 1) {
            if (presentedArticles[i] === referenceArticle) {
                if (what === 'prev') {
                    if (i === 0) {
                        return null; // first article doesn't have previous
                    }
                    return presentedArticles[i - 1];
                } else if (what === 'next') {
                    if (i === presentedArticles.length - 1) {
                        return null; // last article doesn't have next
                    }
                    return presentedArticles[i + 1];
                }
            }
        }
        
        return null;
    }
    
    function getNextUnreadArticle(referenceArticle) {
        var referenceIndex;
        var mode = 'searchingReference';
        
        for (var i = 0; i < presentedArticles.length; i += 1) {
            if (mode === 'searchingUnread') {
                if (i === referenceIndex) {
                    // done full circle and no unread article found
                    return null;
                } else if (!presentedArticles[i].isRead) {
                    return presentedArticles[i];
                }
                if (i === presentedArticles.length - 1) {
                    // search once again from beginning
                    i = -1;
                }
            }
            if (mode === 'searchingReference') {
                if (presentedArticles[i] === referenceArticle) {
                    referenceIndex = i;
                    mode = 'searchingUnread';
                }
            }
        }
        
        return null;
    }
    
    function isScrolledToTop() {
        return articlesList[0].scrollTop < 5; // 5 pixels tolerance
    }
    
    function isScrolledToBottom() {
        return articlesList[0].scrollHeight - articlesList[0].scrollTop < articlesList[0].clientHeight + 5; // 5 pixels tolerance
    }
    
    
    function scrollTo(what) {
        var position;
        var article;
        
        switch (what) {
            case '+1':
            case '-1':
                var distance = 140;
                if (what === '-1') { distance = -distance; }
                position = articlesList.scrollTop() + distance;
                break;
            case 'nextUnread':
                article = getNextUnreadArticle(getFirstVisibleArticle());
                if (article) {
                    // there is still unread article on this page
                    position = angular.element('#' + article.id)[0].offsetTop - 20;
                } else {
                    // all articles on current page are read
                    if ($scope.unreadAfterThisPage > 0) {
                        position = articlesList[0].scrollHeight - articlesList[0].clientHeight;
                    } else if ($scope.unreadBeforeThisPage > 0) {
                        position = 0;
                    } else {
                        // totally no article to scroll to
                        return false;
                    }
                }
                break;
            case 'prev':
            case 'next':
                // if scrolled to top go to previous page
                if (isScrolledToTop() && what === 'prev') {
                    $scope.prevPage();
                    return false;
                }
                // if scrolled to bottom go to next page
                if (isScrolledToBottom() && what === 'next') {
                    $scope.nextPage();
                    return false;
                }
                
                if (isScrolledToTop() && what === 'next' ||
                    isScrolledToBottom() && what === 'prev') {
                    // if top or bottom of the page scroll to first visible article
                    // otherwise the algorithm will omit first, and stroll to second
                    article = getFirstVisibleArticle();
                } else {
                    // else find neighbour article to scroll to
                    article = getArticleNeighbour(what, getFirstVisibleArticle());
                }
                
                if (article) {
                    position = angular.element('#' + article.id)[0].offsetTop - 20;
                } else {
                    // if no next article scroll to top or bottom of the list
                    position = (what === 'prev') ? 0 : articlesList[0].scrollHeight - articlesList[0].clientHeight;
                }
                break;
        }
        
        if (position < 0) {
            position = 0;
        } else if (position > articlesList[0].scrollHeight) {
            position = articlesList[0].scrollHeight;
        }
        
        targetScrollPos = position;
        if (scrollInterval === undefined) {
            autoScrolling = true;
            currScrollPos = articlesList.scrollTop();
            scrollInterval = setInterval(autoScrollLoop, 17);
        }
        
        return true;
    }
    
    $scope.scrollTo = scrollTo;
    
    function autoScrollLoop() {
        var nextScrollPos = currScrollPos + ((targetScrollPos - currScrollPos) / 8);
        
        // if end of scroll
        if (Math.abs(nextScrollPos - currScrollPos) < 0.1) {
            articlesList.scrollTop(targetScrollPos);
            breakScrollLoop();
        }
        
        articlesList.scrollTop(nextScrollPos);
        currScrollPos = nextScrollPos;
    }
    
    function breakScrollLoop() {
        clearInterval(scrollInterval);
        scrollInterval = undefined;
        autoScrolling = false;
        // while autoScrolling we have suspended images lazy loading
        // so now event have to be fired to let them load
        articlesList.scroll();
    }
    
    function markFirstAsReadAndScrollToNext() {
        var article = getFirstVisibleArticle();
        article.setIsRead(true)
        .then(function () {
            $scope.$apply();
            if (!scrollTo('nextUnread')) {
                checkIfAllRead();
            }
        });
    }
    
    articlesList.bind('contextmenu', markFirstAsReadAndScrollToNext);
    
}