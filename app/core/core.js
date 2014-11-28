import config from './config';
import appCtrl from './controllers/app_ctrl';
import analytics from './helpers/analytics';
import schedule from './helpers/schedule';
import downloadService from './services/downloader';
import faviconScout from './helpers/favicon_scout';
import feedParser from './helpers/feed_parser';
import feedScout from './helpers/feed_scout';

var definition = {
    name: 'core'
};

export default definition;

angular.module(definition.name, [])
.controller('AppCtrl', appCtrl)
.service('config', config)
.service('analytics', analytics)
.service('schedule', schedule)
.service('downloadService', downloadService)
.service('feedParser', feedParser)
.service('scout', feedScout)
.run(function (schedule) {
    schedule.start();
});
