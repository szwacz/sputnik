export default function ($rootScope) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: './views/directives/pickTagMenu.html',
        scope: true,
        link: function ($scope, $element) {
            
            var article = $scope.showPickTagMenuData.article;
            var clickedElement = $scope.showPickTagMenuData.clickedElement;
            
            function hide() {
                document.removeEventListener('click', hide, false);
                $scope.$emit('hidePickTagMenu');
            }
            
            process.nextTick(function () {
                document.addEventListener('click', hide, false);
            });
            
            // prevent clicks inside this menu to close the menu itself
            $element.click(function (evt) {
                evt.stopPropagation();
            });
            
            $scope.toggleTag = function (tagId) {
                article.toggleTag(tagId)
                .then(hide);
            };
            
            $scope.addNewTag = function () {
                if (!$scope.newTagName || $scope.newTagName === '') {
                    return;
                }
                article.addNewTag($scope.newTagName)
                .then(function () {
                    $scope.newTagName = '';
                    hide();
                });
            };
            
            $scope.articleHasTag = function (tag) {
                for (var i = 0; i < article.tags.length; i += 1) {
                    if (article.tags[i]._id === tag._id) {
                        return true;
                    }
                }
                return false;
            };
            
            
            // calculate position to put itself
            
            var top = 0;
            function addOffsets(ele) {
                top += ele.offsetTop;
                if ($element[0].offsetParent !== ele) {
                    addOffsets(ele.offsetParent);
                }
            }
            addOffsets(clickedElement);
            
            setTimeout(function () {
                $element.css('top', top - $element.height() - 3);
            }, 1);
            
        }
    };
}