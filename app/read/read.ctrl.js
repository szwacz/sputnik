export default function ($scope) {

    $scope.pickedReadRange = null;

    $scope.setReadRange = function (item) {
        $scope.pickedReadRange = item;
    };

}
