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

    $scope.addCategory = function () {
        feeds.addCategory({
            name: 'New Category'
        });
    };

    $scope.close = function () {
        $scope.$emit('returnToMainScreen');
    };

    $scope.initDragNDropBetweenCategories = function (element, category) {
        Sortable.create(element, {
            group: "moveFeedsBetweenCategories",
            handle: ".js-move",
            sort: false,
            onAdd: function (event) {
                var id = event.item.getAttribute('data-id');
                var feed = feeds.getFeedById(id);
                feed.setCategory(category);
            }
        });
    };

}
