export default function () {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'read/sidebar/category.directive.html',
        scope: true,
        link: function (scope, element) {

            scope.unreadArticlesCount = 0;

        }
    };
};
