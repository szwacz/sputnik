import organizerCtrl from './organize.ctrl';
import categoryDirective from './category.directive';
import feedDirective from './feed.directive';

var definition = {
    name: 'organize',
    view: {
        controller: 'OrganizeCtrl',
        templateUrl: 'organize/organize.html'
    }
};

export default definition;

angular.module(definition.name, [])
.controller('OrganizeCtrl', organizerCtrl)
.directive('organizeCategory', categoryDirective)
.directive('organizeFeed', feedDirective);
