import organizerCtrl from './controllers/organizer_ctrl';
import categoryDirective from './directives/category';
import feedDirective from './directives/feed';

var definition = {
    name: 'organizer',
    view: {
        controller: 'OrganizerCtrl',
        templateUrl: 'organizer/views/organizer.html'
    }
};

export default definition;

angular.module(definition.name, [])
.controller('OrganizerCtrl', organizerCtrl)
.directive('organizerCategory', categoryDirective)
.directive('organizerFeed', feedDirective);