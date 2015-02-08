export default function ($scope, $timeout, $q, scout, feeds) {

    var foundFeedUrl;
    var urlCheckDelay;

    $scope.state = 'idle';
    $scope.url = '';
    $scope.categories = feeds.categories;
    $scope.pickedCategory = null;
    $scope.newCategoryName = '';

    $scope.close = function () {
        $scope.$emit('returnToMainScreen');
    };

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

    var getPickedCategory = function () {
        if ($scope.newCategoryName !== '') {
            return feeds.getOrCreateCategoryByName($scope.newCategoryName)
        }

        var deferred = $q.defer();
        if ($scope.pickedCategory !== null) {
            deferred.resolve($scope.pickedCategory);
        } else {
            deferred.resolve(feeds.uncategorized);
        }
        return deferred.promise;
    };

    $scope.addFeed = function () {
        getPickedCategory()
        .then(function (category) {
            return category.addFeed({
                url: foundFeedUrl
            });
        })
        .then(function () {
            $scope.close();
        });
    };

}
