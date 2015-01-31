import readCtrl from './read.ctrl';
import readSidebarCtrl from './sidebar/sidebar.ctrl';
import sidebarCategoryDirective from './sidebar/category.directive'
import sidebarFeedDirective from './sidebar/feed.directive'
import readArticlesCtrl from './articles/articles.ctrl';

var definition = {
    name: 'read'
};

export default definition;

angular.module(definition.name, [])
.directive('readSidebarCategory', sidebarCategoryDirective)
.directive('readSidebarFeed', sidebarFeedDirective)
.controller('ReadCtrl', readCtrl)
.controller('ReadSidebarCtrl', readSidebarCtrl)
.controller('ReadArticlesCtrl', readArticlesCtrl);
