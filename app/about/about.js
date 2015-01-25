import aboutCtrl from './about.ctrl';

var definition = {
    name: 'about',
    view: {
        controller: 'AboutCtrl',
        templateUrl: 'about/about.html'
    }
};

export default definition;

angular.module(definition.name, [])
.controller('AboutCtrl', aboutCtrl);
