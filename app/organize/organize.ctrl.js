var jetpack = require('fs-jetpack');

export default function ($scope, feeds, opml) {

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
        element.on('dragover', function (event) {
            var id = event.originalEvent.dataTransfer.getData('feedId');
            if (id) {
                event.preventDefault();
            }
        });
        element.on('drop', function (event) {
            var id = event.originalEvent.dataTransfer.getData('feedId');
            var feed = feeds.getFeedById(id);
            if (feed) {
                feed.setCategory(category);
                event.preventDefault();
            }
        });
    };

    $scope.exportFeeds = function () {
        $('#export-file-input').trigger('click');
    };
    $('#export-file-input').change(function () {
        var filePath = this.value;
        jetpack.fileAsync(filePath, {
            content: opml.export()
        });
    });

    $scope.importFeeds = function () {
        $('#import-file-input').trigger('click');
    };
    $('#import-file-input').change(function () {
        var filePath = this.value;
        jetpack.readAsync(filePath)
        .then(function (fileContent) {
            opml.import(fileContent);
        });
    });
}
