export default function () {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'organizer/views/category.html',
        scope: {
            category: '=',
            categoriesNames: '=',
        },
        link: function ($scope) {
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
};