export default function (articles) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'read/sidebar/feed.directive.html',
        scope: true,
        link: function (scope, element) {

            var recountTimeout;

            var recountUnread = function () {
                articles.countUnread(scope.feed.id)
                .then(function (count) {
                    scope.unreadArticlesCount = count;
                    scope.$apply();
                    scope.$emit('feedUnreadArticlesRecounted', {
                        feedId: scope.feed.id,
                        count: count
                    })
                });
            };

            var recountUnreadMaybe = function (event, articleId, feedId) {
                if (feedId !== scope.feed.id) {
                    // Not our business
                    return;
                }

                // Wait some time before counting, because we could
                // have a flood of those events.
                clearInterval(recountTimeout);
                recountTimeout = setTimeout(recountUnread, 100);
            };

            scope.amISelected = function () {
                return scope.pickedReadRange === scope.feed;
            };

            scope.$on('articles:articleCreated', recountUnreadMaybe);
            scope.$on('articles:articleUpdated', recountUnreadMaybe);

            recountUnread();
        }
    };
};
