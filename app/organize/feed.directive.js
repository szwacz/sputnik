export default function ($timeout) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'organize/feed.directive.html',
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

            scope.discardNameChange = function () {
                scope.state = 'none';
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
                } else {
                    scope.discardNameChange();
                }
            };

            scope.delete = function () {
                scope.feed.remove();
            };

            var initDragNDrop = function () {
                var isHandle = false;
                element.attr('draggable', 'true');
                element.on('mousedown', function (event) {
                    if ($(event.target).is('.js-handle')) {
                        isHandle = true;
                    } else {
                        isHandle = false;
                    }
                });
                element.on('dragstart', function (event) {
                    if (!isHandle) {
                        return false;
                    }
                    event.originalEvent.dataTransfer.setData("feedId", scope.feed.id);
                });
            };

            initDragNDrop();

        }
    };
};
