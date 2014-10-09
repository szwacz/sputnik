export default function OrganizeCtrl($scope, feedsService) {
    
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