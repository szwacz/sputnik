export default function AboutCtrl($scope, $routeParams, config) {
    $scope.subview = $routeParams.subview;
    $scope.appVersion = config.version;
    $scope.websiteUrl = config.websiteUrl;
    $scope.websiteUrlUpdate = config.websiteUrlUpdate;
}