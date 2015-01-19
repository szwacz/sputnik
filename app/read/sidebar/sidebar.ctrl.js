export default function ($scope, feeds) {

    $scope.categories = feeds.categories;
    $scope.uncategorized = feeds.uncategorized;

    $scope.showCategory = function (category) {
        console.log('Show category:', category.id);
    };

    $scope.showFeed = function (feed) {
        console.log('Show feed:', feed.id);
    };

}
