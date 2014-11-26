import appCtrl from './controllers/app_ctrl';
import analytics from './services/analytics';
import schedule from './services/schedule';
import feedsService from './services/feeds';
import articlesService from './services/articles';
import downloadService from './services/downloader';
import faviconScout from './helpers/favicon_scout';
import feedParser from './helpers/feed_parser';
import scout from './helpers/feed_scout';

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
.service('feedParser', feedParser)
.service('scout', scout)
.run(function (schedule) {
    schedule.start();
});
