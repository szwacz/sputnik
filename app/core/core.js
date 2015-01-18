import config from './config';
import analytics from './helpers/analytics';
import schedule from './helpers/schedule';
import downloader from './helpers/downloader';
import faviconScout from './helpers/favicon_scout';
import feedParser from './helpers/feed_parser';
import feedScout from './helpers/feed_scout';
import feeds from './models/feeds';
import articles from './models/articles';
import opml from './models/opml';
import appCtrl from './app.ctrl'

var Q = require('q');

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
.service('feeds', feeds)
.service('articles', articles)
.service('opml', opml)
.controller('AppCtrl', appCtrl)
.run(function (config, feeds, articles, schedule) {

    Q.all([
        feeds.init(config.userDataStorageDir),
        articles.init(config.userDataStorageDir),
    ])
    .then(function () {
        schedule.start();
    });

});
