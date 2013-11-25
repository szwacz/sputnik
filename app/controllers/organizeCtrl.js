'use strict';

function OrganizeCtrl($scope, feedsService) {
    
    function refresh() {
        $scope.feedsTree = feedsService.tree;
        $scope.categoriesNames = feedsService.categoriesNames;
    }
    
    $scope.newCategoryName = '';
    $scope.addNewCategory = function () {
        feedsService.addCategory($scope.newCategoryName);
        $scope.newCategoryName = '';
        refresh();
    };
    
    $scope.$on('changed', refresh);
    
    refresh();
}

//---------------------------------------------------------
// Helper directives
//---------------------------------------------------------

function organizeCategoryDirective() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: './views/directives/organizeCategory.html',
        scope: {
            category: '=',
            categoriesNames: '=',
        },
        link: function ($scope, element, attrs) {
            $scope.showRename = false;
            $scope.showDelete = false;
            $scope.newName = $scope.category.title;
            $scope.rename = function () {
                $scope.category.setTitle($scope.newName);
                $scope.$emit('changed');
            };
            $scope.remove = function () {
                $scope.category.remove();
                $scope.$emit('changed');
            };
        }
    };
}

function organizeFeedDirective() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: './views/directives/organizeFeed.html',
        scope: {
            feed: '=',
            categoriesNames: '=',
        },
        link: function ($scope, element, attrs) {
            $scope.showChangeCategory = false;
            $scope.showDelete = false;
            $scope.chosenCategoryName = $scope.feed.category;
            $scope.changeCategory = function () {
                $scope.feed.category = $scope.chosenCategoryName;
                $scope.$emit('changed');
            };
            $scope.remove = function () {
                $scope.feed.remove();
                $scope.$emit('changed');
            };
        }
    };
}