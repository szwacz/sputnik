import appCtrl from './controllers/app_ctrl';
import analytics from './services/analytics';
import schedule from './services/schedule';
import feedsService from './services/feeds';
import articlesService from './services/articles';
import downloadService from './services/downloader';
import faviconsService from './services/favicons';

var definition = {
    name: 'core'
};

export default definition;

angular.module(definition.name, [])
.controller('AppCtrl', appCtrl)
.service('analytics', analytics)
.service('schedule', schedule)
.service('articlesService', articlesService)
.service('downloadService', downloadService)
.service('faviconsService', faviconsService)
.service('feedsService', feedsService)
.run(function (schedule) {
    schedule.start();
});