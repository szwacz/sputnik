export default function TagsCtrl($scope, feedsService) {
    
    $scope.changeTagName = function (tag, newName) {
        tag.setName(newName)
        .then(function () {
            $scope.$apply();
        });
    };
    
    $scope.removeTag = function (tag) {
        tag.remove()
        .then(function () {
            $scope.$apply();
        });
    };
    
}