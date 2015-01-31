export default function ($scope, feeds) {

    $scope.categories = feeds.categories;
    $scope.uncategorized = feeds.uncategorized;

    var refreshScope = function () {
        $scope.$apply();
    };

    $scope.$on('feeds:initiated', refreshScope);
    $scope.$on('feeds:categoryAdded', refreshScope);
    $scope.$on('feeds:categoryUpdated', refreshScope);
    $scope.$on('feeds:categoryRemoved', refreshScope);
    $scope.$on('feeds:feedAdded', refreshScope);
    $scope.$on('feeds:feedUpdated', refreshScope);
    $scope.$on('feeds:feedRemoved', refreshScope);

    $scope.showCategory = function (category) {
        console.log('Show category:', category.id);
    };

    $scope.showFeed = function (feed) {
        console.log('Show feed:', feed.id);
    };

    // Table to keep count data for particular feeds.
    var countUnreadTable = {};

    var recountUnread = function () {
        $scope.allUnreadArticlesCount = Object.keys(countUnreadTable)
        .reduce(function (currCount, feedId) {
            return currCount + countUnreadTable[feedId];
        }, 0);
        refreshScope();
    };

    $scope.$on('feedUnreadArticlesRecounted', function (event, countStatus) {
        countUnreadTable[countStatus.feedId] = countStatus.count;
        recountUnread();
    });

}
