import tagsCtrl from './controllers/tags_ctrl';

var definition = {
    name: 'tags',
    view: {
        controller: 'TagsCtrl',
        templateUrl: 'tags/views/tags.html'
    }
};

export default definition;

angular.module(definition.name, [])
.controller('TagsCtrl', tagsCtrl);