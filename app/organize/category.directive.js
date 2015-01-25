export default function ($timeout) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'organize/category.directive.html',
        scope: true,
        link: function (scope, element) {

            scope.state = 'none';

            scope.changeName = function () {
                scope.newName = scope.category.name;
                scope.state = 'changeName';
                $timeout(function () {
                    element.find('.js-name-input').focus();
                }, 0);
            };

            scope.saveName = function () {
                if (scope.newName != '') {
                    scope.category
                    .update({
                        name: scope.newName
                    })
                    .then(function () {
                        scope.state = 'none';
                        scope.$apply();
                    });
                } else {
                    scope.state = 'none';
                }
            };

            scope.delete = function () {
                scope.category.remove();
            };

            scope.initDragNDropBetweenCategories(
                element.find('.js-feeds'),
                scope.category
            );

        }
    };
};
