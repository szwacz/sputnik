import aboutCtrl from './controllers/about_ctrl';

var definition = {
    name: 'about',
    view: {
        controller: 'AboutCtrl',
        templateUrl: 'about/views/main.html'
    }
};

export default definition;

angular.module(definition.name, [])
.controller('AboutCtrl', aboutCtrl);