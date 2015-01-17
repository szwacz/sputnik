import readCtrl from './read.ctrl';
import readSidebarCtrl from './sidebar/sidebar.ctrl';
import readArticlesCtrl from './articles/articles.ctrl';

var definition = {
    name: 'read'
};

export default definition;

angular.module(definition.name, [])
.controller('ReadCtrl', readCtrl)
.controller('ReadSidebarCtrl', readSidebarCtrl)
.controller('ReadArticlesCtrl', readArticlesCtrl);
