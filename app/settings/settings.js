import settingsCtrl from './controllers/settings_ctrl';

var definition = {
    name: 'settings',
    view: {
        controller: 'SettingsCtrl',
        templateUrl: 'settings/views/settings.html'
    }
};

export default definition;

angular.module(definition.name, [])
.controller('SettingsCtrl', settingsCtrl);