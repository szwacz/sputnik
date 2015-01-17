import addFeedCtrl from './add_feed.ctrl';

var definition = {
    name: 'addFeed',
    view: {
        controller: 'AddFeedCtrl',
        templateUrl: 'add_feed/add_feed.html'
    }
};

export default definition;

angular.module(definition.name, [])
.controller('AddFeedCtrl', addFeedCtrl);
