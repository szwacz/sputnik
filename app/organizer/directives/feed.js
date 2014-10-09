export default function () {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'organizer/views/feed.html',
        scope: {
            feed: '=',
            categoriesNames: '=',
        },
        link: function ($scope) {
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
};