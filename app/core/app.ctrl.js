export default function ($scope, $location) {

    $scope.$on('returnToMainScreen', function () {
        $location.path('/');
    });

}
