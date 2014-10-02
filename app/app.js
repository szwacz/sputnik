import dataManager from './dataManager/dataManager';
import initSputnikConfig from './config';
import feedsStorage from './models/feedsStorage';
import articlesStorage from './models/articlesStorage';
import net from './helpers/net';
import opml from './helpers/opml';
import feedParser from './helpers/feedParser';
import feedsWaitingRoom from './helpers/feedsWaitingRoom';

import aboutCtrl from './controllers/aboutCtrl';
import addFeedCtrl from './controllers/addFeedCtrl';
import appCtrl from './controllers/appCtrl';
import importExportCtrl from './controllers/importExportCtrl';
import organizeCtrl from './controllers/organizeCtrl';
import readCtrl from './controllers/readCtrl';
import settingsCtrl from './controllers/settingsCtrl';
import tagsCtrl from './controllers/tagsCtrl';

import articlesListDirective from './directives/articlesList';
import dropdownDirective from './directives/dropdown';
import pickTagMenuDirective from './directives/pickTagMenu';
import organizeCategoryDirective from './directives/organizeCategory';
import organizeFeedDirective from './directives/organizeFeed';
import articlesService from './services/articlesService';
import downloadService from './services/downloadService';
import faviconsService from './services/faviconsService';
import feedsService from './services/feedsService';
import updateService from './services/updateService';

var gui = require('nw.gui');

// on document ready
$(initDataModel);

function initDataModel() {
    // dataManager lets run app startup code if sure user data model is up to date
    dataManager(initConfig);
}

function initConfig(userDataPath, currentDataModelVersion) {
    initSputnikConfig(userDataPath, currentDataModelVersion, function (config) {
        initApp(config);
    });
}

function initApp(config) {
    
    var dataPath = config.dataHomeFolder + '/feeds.json';
    
    feedsStorage.make(dataPath)
    .then(function (fst) {
        
        var sputnik = angular.module('sputnik', ['ngRoute', 'ngSanitize', 'ngAnimate']);
        console.log(appCtrl)
        sputnik.controller('AboutCtrl', aboutCtrl);
        sputnik.controller('AddFeedCtrl', addFeedCtrl);
        sputnik.controller('AppCtrl', appCtrl);
        sputnik.controller('ImportExportCtrl', importExportCtrl);
        sputnik.controller('OrganizeCtrl', organizeCtrl);
        sputnik.controller('ReadCtrl', readCtrl);
        sputnik.controller('SettingsCtrl', settingsCtrl);
        sputnik.controller('TagsCtrl', tagsCtrl);
        
        sputnik.directive('articlesList', articlesListDirective);
        sputnik.directive('dropdown', dropdownDirective);
        sputnik.directive('pickTagMenu', pickTagMenuDirective);
        sputnik.directive('organizeCategory', organizeCategoryDirective);
        sputnik.directive('organizeFeed', organizeFeedDirective);
        
        sputnik.factory('articlesService', articlesService);
        sputnik.factory('downloadService', downloadService);
        sputnik.factory('faviconsService', faviconsService);
        sputnik.factory('feedsService', feedsService);
        sputnik.factory('updateService', updateService);
        
        sputnik.config(function ($provide, $routeProvider) {
            
            // initiating modules for injection into angular
            
            $provide.value('config', config);
            $provide.value('feedsStorage', fst);
            
            var dbPath = config.dataHomeFolder + '/articles.nedb';
            $provide.value('articlesStorage', articlesStorage.make(dbPath));
            
            $provide.value('feedsWaitingRoom', feedsWaitingRoom.init(config.dataHomeFolder + '/feeds-waiting-room'));
            
            net.proxyDiscoveryFunc(gui.App.getProxyForURL);
            $provide.value('net', net);
            
            $provide.value('opml', opml);
            $provide.value('feedParser', feedParser);
            
            // Configuring routes
            
            $routeProvider.when('/', {
                controller: 'ReadCtrl',
                templateUrl: 'views/read.html'
            }).when('/importExport', {
                controller: 'ImportExportCtrl',
                templateUrl: 'views/importExport.html'
            }).when('/add', {
                controller: 'AddFeedCtrl',
                templateUrl: 'views/addFeed.html'
            }).when('/organize', {
                controller: 'OrganizeCtrl',
                templateUrl: 'views/organize.html'
            }).when('/tags', {
                controller: 'TagsCtrl',
                templateUrl: 'views/tags.html'
            }).when('/settings', {
                controller: 'SettingsCtrl',
                templateUrl: 'views/settings.html'
            }).when('/about/:subview', {
                controller: 'AboutCtrl',
                templateUrl: 'views/about/main.html'
            });
            
        });
        
        // Bootstrap angular
        
        angular.bootstrap(document.documentElement, ['sputnik']);
    });
    
}