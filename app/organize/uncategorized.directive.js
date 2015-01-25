export default function () {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'organize/uncategorized.directive.html',
        scope: true,
        link: function (scope, element) {

            scope.initDragNDropBetweenCategories(
                element.find('.js-feeds').get(0),
                scope.uncategorized
            );

        }
    };
};
