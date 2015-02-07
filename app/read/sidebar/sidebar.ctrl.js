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

    // Table to keep count data for particular feeds.
    var countUnreadTable = {};

    var recountUnread = function () {
        $scope.allUnreadArticlesCount = Object.keys(countUnreadTable)
        .reduce(function (currCount, feedId) {
            return currCount + countUnreadTable[feedId];
        }, 0);
        refreshScope();
    };

    $scope.allCategory = {
        name: 'All',
        feeds: feeds.all
    };

    $scope.isAllSelected = function () {
        return $scope.pickedReadRange === $scope.allCategory;
    };

    $scope.$on('feedUnreadArticlesRecounted', function (event, countStatus) {
        countUnreadTable[countStatus.feedId] = countStatus.count;
        recountUnread();
    });

    // On init always select all.
    $scope.setReadRange($scope.allCategory);

}
