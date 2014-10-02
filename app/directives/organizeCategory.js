export default function () {
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
};