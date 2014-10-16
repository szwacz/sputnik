import coreModule from './core/core';
import readModule from './read/read';
import addFeedModule from './add_feed/add_feed';
import organizerModule from './organizer/organizer';
import tagsModule from './tags/tags';
import importExportModule from './import_export/import_export';
import settingsModule from './settings/settings';
import aboutModule from './about/about';

import dataManager from './core/data_migrator/data_migrator';
import initSputnikConfig from './config';
import feedsStorage from './core/models/feeds_storage';
import articlesStorage from './core/models/articles_storage';

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
            addFeedModule.name,
            organizerModule.name,
            tagsModule.name,
            importExportModule.name,
            settingsModule.name,
            aboutModule.name,
            'ngRoute',
            'ngSanitize',
            'ngAnimate',
        ]);
        
        sputnik.config(function ($provide, $routeProvider) {
            
            // initiating modules for injection into angular
            
            $provide.value('config', config);
            $provide.value('feedsStorage', fst);
            
            var dbPath = config.dataHomeFolder + '/articles.nedb';
            $provide.value('articlesStorage', articlesStorage.make(dbPath));
            
            // Configuring routes
            
            $routeProvider
            .when('/', readModule.view)
            .when('/importExport', importExportModule.view)
            .when('/add', addFeedModule.view)
            .when('/organize', organizerModule.view)
            .when('/tags', tagsModule.view)
            .when('/settings', settingsModule.view)
            .when('/about/:subview', aboutModule.view);
            
        });
        
        // Bootstrap angular
        
        angular.bootstrap(document.documentElement, ['sputnik']);
    });
    
}