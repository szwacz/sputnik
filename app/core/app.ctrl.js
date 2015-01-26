export default function ($scope, $location, downloader, faviconScout) {

    var loadFavicon = function (feed) {
        if (feed.siteUrl) {
            faviconScout.scout(feed.siteUrl)
            .then(function (favicon) {
                return feed.storeFavicon(favicon.bytes, favicon.format);
            });
        }
    };

    $scope.$on('returnToMainScreen', function () {
        $location.path('/');
    });

    $scope.$on('feeds:feedAdded', function (event, feed) {
        downloader.download([feed])
        .then(function () {
            loadFavicon(feed);
        });
    });

}
