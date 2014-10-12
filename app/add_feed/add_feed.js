import addFeedCtrl from './controllers/add_feed_ctrl';

var definition = {
    name: 'addFeed',
    view: {
        controller: 'AddFeedCtrl',
        templateUrl: 'add_feed/views/add_feed.html'
    }
};

export default definition;

angular.module(definition.name, [])
.controller('AddFeedCtrl', addFeedCtrl);