export default function ($scope, $location, faviconScout) {

    var loadFavicon = function (feed) {
        if (feed.siteUrl) {
            faviconScout.scout(feed.siteUrl)
            .then(function (favicon) {
                return feed.storeFavicon(favicon.bytes, favicon.format);
            });
        }
    });

    $scope.$on('returnToMainScreen', function () {
        $location.path('/');
    });

    $scope.$on('feeds:feedAdded', function (event, feed) {
        // Feed just have been added, so its data (and siteUrl) is unknown yet.
        var count = 0;
        var interval = setInterval(function () {
            count += 1;
            if (feed.siteUrl) {
                clearInterval(interval);
                loadFavicon();
            } else if (count > 120) {
                // Give up.
                clearInterval(interval);
            }
        }, 1000);
    });

}
