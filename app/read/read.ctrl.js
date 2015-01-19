export default function ($scope) {

    $scope.$on('feeds:listUpdated', function () {
        $scope.$apply();
    });

}
