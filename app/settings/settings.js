import settingsCtrl from './settings.ctrl';

var definition = {
    name: 'settings',
    view: {
        controller: 'SettingsCtrl',
        templateUrl: 'settings/settings.html'
    }
};

export default definition;

angular.module(definition.name, [])
.controller('SettingsCtrl', settingsCtrl);
