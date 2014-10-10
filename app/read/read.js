import readCtrl from './controllers/read_ctrl';
import articlesListDirective from './directives/articles_list';
import pickTagMenuDirective from './directives/pick_tag_menu';

var definition = {
    name: 'read',
    view: {
        controller: 'ReadCtrl',
        templateUrl: 'read/views/read.html'
    }
};

export default definition;

angular.module(definition.name, [])
.controller('ReadCtrl', readCtrl)
.directive('articlesList', articlesListDirective)
.directive('pickTagMenu', pickTagMenuDirective);