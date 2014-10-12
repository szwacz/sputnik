import appCtrl from './controllers/app_ctrl';
import analytics from './services/analytics';
import schedule from './services/schedule';

var definition = {
    name: 'core'
};

export default definition;

angular.module(definition.name, [])
.controller('AppCtrl', appCtrl)
.service('analytics', analytics)
.service('schedule', schedule)
.run(function (schedule) {
    schedule.start();
});