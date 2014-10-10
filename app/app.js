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
import appCtrl from './controllers/appCtrl';
import readCtrl from './controllers/readCtrl';
import settingsCtrl from './controllers/settingsCtrl';

import articlesListDirective from './directives/articlesList';
import dropdownDirective from './directives/dropdown';
import pickTagMenuDirective from './directives/pickTagMenu';
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
        
        var sputnik = angular.module('sputnik', [
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
        sputnik.controller('AppCtrl', appCtrl);
        sputnik.controller('ReadCtrl', readCtrl);
        
        sputnik.directive('articlesList', articlesListDirective);
        sputnik.directive('dropdown', dropdownDirective);
        sputnik.directive('pickTagMenu', pickTagMenuDirective);
        
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
            
            net.proxyDiscoveryFunc(gui.App.getProxyForURL);
            $provide.value('net', net);
            
            $provide.value('feedParser', feedParser);
            
            // Configuring routes
            
            $routeProvider
            .when('/', {
                controller: 'ReadCtrl',
                templateUrl: 'views/read.html'
            })
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