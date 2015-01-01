import config from './config';
import analytics from './helpers/analytics';
import schedule from './helpers/schedule';
import downloader from './helpers/downloader';
import faviconScout from './helpers/favicon_scout';
import feedParser from './helpers/feed_parser';
import feedScout from './helpers/feed_scout';

var definition = {
    name: 'core'
};

export default definition;

angular.module(definition.name, [])
.service('config', config)
.service('analytics', analytics)
.service('schedule', schedule)
.service('downloader', downloader)
.service('feedParser', feedParser)
.service('scout', feedScout)
.run(function (schedule) {
    schedule.start();
});
