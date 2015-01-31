export default function () {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'read/sidebar/category.directive.html',
        scope: true,
        link: function (scope, element) {

            // Table to keep count data for particular feeds.
            var countUnreadTable = {};

            var recountUnread = function () {
                scope.unreadArticlesCount = Object.keys(countUnreadTable)
                .reduce(function (currCount, feedId) {
                    return currCount + countUnreadTable[feedId];
                }, 0);
                scope.$apply();
            };

            scope.$on('feedUnreadArticlesRecounted', function (event, countStatus) {
                countUnreadTable[countStatus.feedId] = countStatus.count;
                recountUnread();
            });

        }
    };
};
