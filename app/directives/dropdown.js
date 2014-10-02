export default function () {
    return {
        restrict: 'C',
        link: function ($scope, $element) {
            
            var btn = angular.element($element.children()[0]);
            
            btn.bind('click', function () {
                $element.toggleClass('dropdown--opened');
                process.nextTick(function () {
                    document.addEventListener('click', hide, false);
                });
            });
            
            function hide() {
                $element.toggleClass('dropdown--opened');
                document.removeEventListener('click', hide, false);
            }
            
            $scope.$on('$destroy', function () {
                document.removeEventListener('click', hide, false);
            });
        }
    };
}