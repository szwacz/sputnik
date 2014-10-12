import coreModule from './core/core';
import readModule from './read/read';
import organizerModule from './organizer/organizer';
import tagsModule from './tags/tags';
import importExportModule from './import_export/import_export';
import settingsModule from './settings/settings';
import aboutModule from './about/about';

import dataManager from './dataManager/dataManager';
import initSputnikConfig from './config';
import feedsStorage from './models/feedsStorage';
import articlesStorage from './models/articlesStorage';
import net from './helpers/net';
import feedParser from './helpers/feedParser';

import addFeedCtrl from './controllers/addFeedCtrl';

import dropdownDirective from './directives/dropdown';
import articlesService from './services/articlesService';
import downloadService from './services/downloadService';
import faviconsService from './services/faviconsService';
import feedsService from './services/feedsService';

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
        
        var sputnik = angular.module('sputnik', [
            coreModule.name,
            readModule.name,
            organizerModule.name,
            tagsModule.name,
            importExportModule.name,
            settingsModule.name,
            aboutModule.name,
            'ngRoute',
            'ngSanitize',
            'ngAnimate',
        ]);
        
        sputnik.controller('AddFeedCtrl', addFeedCtrl);
        
        sputnik.directive('dropdown', dropdownDirective);
        
        sputnik.factory('articlesService', articlesService);
        sputnik.factory('downloadService', downloadService);
        sputnik.factory('faviconsService', faviconsService);
        sputnik.factory('feedsService', feedsService);
        
        sputnik.config(function ($provide, $routeProvider) {
            
            // initiating modules for injection into angular
            
            $provide.value('config', config);
            $provide.value('feedsStorage', fst);
            
            var dbPath = config.dataHomeFolder + '/articles.nedb';
            $provide.value('articlesStorage', articlesStorage.make(dbPath));
            
            net.proxyDiscoveryFunc(gui.App.getProxyForURL);
            $provide.value('net', net);
            
            $provide.value('feedParser', feedParser);
            
            // Configuring routes
            
            $routeProvider
            .when('/', readModule.view)
            .when('/importExport', importExportModule.view)
            .when('/add', {
                controller: 'AddFeedCtrl',
                templateUrl: 'views/addFeed.html'
            })
            .when('/organize', organizerModule.view)
            .when('/tags', tagsModule.view)
            .when('/settings', settingsModule.view)
            .when('/about/:subview', aboutModule.view);
            
        });
        
        // Bootstrap angular
        
        angular.bootstrap(document.documentElement, ['sputnik']);
    });
    
}