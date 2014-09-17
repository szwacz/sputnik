'use strict';

function AddFeedCtrl($scope, $location, feedsService, net, feedParser) {
    
    var gui = require('nw.gui');
    var scout = require('./helpers/feedScout');
    var determinedFeedUrl;
    var clipboard = gui.Clipboard.get();
    
    function constructCategoriesOptions() {
        var cats = [
            {
                name: "(none)",
                value: ""
            },
            {
                name: "(new category)",
                value: "#addNewCategory#"
            }
        ];
        feedsService.categoriesNames.forEach(function (category) {
            cats.push({
                name: category,
                value: category
            });
        });
        return cats;
    }
    
    $scope.state = 'form';
    $scope.url = '';
    $scope.urlValidity = 'idle';
    $scope.categories = constructCategoriesOptions();
    $scope.chosenCategory = $scope.categories[0];
    $scope.newCategory = '';
    
    var checkUrlTimeout = 0;
    
    $scope.urlChange = function () {
        var url = $scope.url;
        if (checkUrlTimeout) {
            clearTimeout(checkUrlTimeout);
            checkUrlTimeout = 0;
        }
        checkUrlTimeout = setTimeout(function () {
            $scope.urlValidity = 'checking';
            $scope.$apply();
            checkUrlTimeout = 0;
            scout.scout(url.trim(), net, feedParser)
            .then(function (feedUrl) {
                if (url !== $scope.url) {
                    // it means user typed more characters and this search is obsolete
                    return;
                }
                $scope.urlValidity = 'yes';
                determinedFeedUrl = feedUrl;
                $scope.$apply();
            }, function (err) {
                if (url !== $scope.url) {
                    // it means user typed more characters and this search is obsolete
                    return;
                }
                switch (err.code) {
                    case '404':
                        $scope.urlValidity = '404';
                        break;
                    case 'ETIMEDOUT':
                    case 'ECONNREFUSED':
                    case 'ENOTFOUND':
                        $scope.urlValidity = 'connectionProblem';
                        break;
                    default:
                        $scope.urlValidity = 'no';
                }
                determinedFeedUrl = undefined;
                $scope.$apply();
            });
        }, 500);
    };
    
    $scope.add = function () {
        if ($scope.state !== 'form' || $scope.urlValidity !== 'yes') {
            return;
        }
        
        var feedBaseModel = {
            url: determinedFeedUrl
        };
        
        if ($scope.newCategory !== '') {
            feedBaseModel.category = $scope.newCategory;
        } else if ($scope.chosenCategory.value !== '' &&
                    $scope.chosenCategory.value !== '#addNewCategory#') {
            feedBaseModel.category = $scope.chosenCategory.value;
        }
        
        $scope.state = 'loadingFeed';
        
        feedsService.addFeed(feedBaseModel);
        $location.path('/');
    };
    
    // context menu for pasting text
    function initContextMenu() {
        var menu = new gui.Menu();
        menu.append(new gui.MenuItem({
            label: 'Paste',
            click: function () {
                angular.element('#url-input').val(clipboard.get());
            }
        }));
        
        angular.element('#url-input').on('contextmenu', function(ev) {
            ev.preventDefault();
            menu.popup(ev.pageX, ev.pageY);
            return false;
        });
    }
    
    initContextMenu();
}