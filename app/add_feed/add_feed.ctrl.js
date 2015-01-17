export default function ($scope, $timeout, scout, feeds) {

    var foundFeedUrl;
    var urlCheckDelay;

    $scope.state = 'idle';
    $scope.url = '';

    $scope.scoutFeedUrl = function () {
        var testedUrl = $scope.url;

        $scope.state = 'scouting';

        var isThisCheckStillValid = function () {
            // This function can fire multiple times, and be laggy.
            // After receiving response we should check if given request
            // is till the latest (user might typed more characters and
            // our check here is irrelevant now).
            return $scope.url === testedUrl;
        };

        scout.scout(testedUrl)
        .then(function (url) {
            if (isThisCheckStillValid()) {
                foundFeedUrl = url;
                $scope.state = 'ok';
                $scope.$apply();
            }
        })
        .catch(function (err) {
            if (isThisCheckStillValid()) {
                if (err.code === 'noFeed') {
                    $scope.state = 'noFeed';
                } else {
                    $scope.state = 'networkFail';
                }
                $scope.$apply();
            }
        });
    };

    $scope.onUrlChange = function () {
        // Wait some time before scouting, because user might
        // enter more characters into the field.
        if (urlCheckDelay) {
            $timeout.cancel(urlCheckDelay);
        }
        urlCheckDelay = $timeout($scope.scoutFeedUrl, 750);
    };

    $scope.done = function () {
        
    };

}
