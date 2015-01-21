export default function ($scope, feeds) {

    $scope.categories = feeds.categories;
    $scope.uncategorized = feeds.uncategorized;

    $scope.$on('categoryRemoved', function () {
        $scope.$apply();
    });
    $scope.$on('feedRemoved', function () {
        $scope.$apply();
    });

    $scope.addCategory = function () {
        feeds.addCategory({
            name: 'New Category'
        })
        .then(function () {
            $scope.$apply();
        });
    };

    $scope.close = function () {
        $scope.$emit('returnToMainScreen');
    };


}
