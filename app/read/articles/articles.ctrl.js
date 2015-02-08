export default function ($scope, feeds, articles) {

    var articlesDisplay;

    var prepareQuery = function () {
        var feedIds;
        if (Array.isArray($scope.pickedReadRange.feeds)) {
            // We have chosen category.
            feedIds = $scope.pickedReadRange.feeds.map(function (feed) {
                 return feed.id;
            });
        } else {
            // We have chosen single feed.
            feedIds = [$scope.pickedReadRange.id];
        }
        return {
            feedId: { $in: feedIds }
        };
    };

    var resetToFirstUnread = function () {
        // TODO
        articlesDisplay.reset(0);
    };

    $scope.$on('hereYouHaveArticlesDisplayApi', function (event, _articlesDisplay_) {

        articlesDisplay = _articlesDisplay_;

        articlesDisplay.needArticles = function (startIndex, endIndex, callback) {
            feeds.ensureInitiated().then(function () {
                var limit = endIndex - startIndex;
                articles.query(prepareQuery(), startIndex, limit)
                .then(callback)
                .catch(function (err) {
                    console.error(err);
                });
            });
        };

        $scope.$watch('pickedReadRange', function () {
            // Range of feeds we are interested in has changed. Reset everything.
            resetToFirstUnread();
        });

        resetToFirstUnread();
    });

}
