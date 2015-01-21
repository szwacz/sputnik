export default function () {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'organize/feed.directive.html',
        scope: {
            feed: '='
        },
        link: function (scope, element) {

            scope.state = 'none';

            scope.changeName = function () {
                scope.newName = scope.category.name;
                scope.state = 'changeName';
            };

            scope.saveName = function () {
                if (scope.newName != '') {
                    scope.feed
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
                scope.feed
                .remove()
                .then(function () {
                    scope.$emit('feedRemoved');
                });
            };


        }
    };
};
