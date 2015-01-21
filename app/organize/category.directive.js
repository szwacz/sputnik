export default function () {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'organize/category.directive.html',
        scope: {
            category: '='
        },
        link: function (scope, element) {

            scope.state = 'none';

            scope.changeName = function () {
                scope.newName = scope.category.name;
                scope.state = 'changeName';
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
                }
            };

            scope.delete = function () {
                scope.category
                .remove()
                .then(function () {
                    scope.$emit('categoryRemoved');
                });
            };

        }
    };
};
