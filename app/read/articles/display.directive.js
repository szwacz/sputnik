export default function () {
    return {
        restrict: 'E',
        scope: true,
        link: function (scope, element) {

            var currIndex = 0;

            var onArticlesArrived = function (articles) {
                element.empty();
                articles.forEach(function (article) {
                    element.append('<div>' + article.title + '</div>');
                });
            };

            var reset = function (index) {
                currIndex = index;
                api.needArticles(index, index + 3, onArticlesArrived);
            };

            // The object handles two way communication between this instance
            // and actor on other side who has access to articles data.
            var api = {
                reset: reset,
                needArticles: function (startIndex, endIndex, callback) {
                    // Noop, have ot be reimplemented by actor on other side.
                }
            };

            scope.$emit('hereYouHaveArticlesDisplayApi', api);

        }
    };
};
