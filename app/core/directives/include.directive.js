// Like ng-include but replaces element on which was declared.

export default function () {
    return {
        replace: true,
        restrict: 'A',
        templateUrl: function (element, attr) {
            return attr.include;
        }
    };
};
