/**
 * App bootstrap script
 */

'use strict';

var sputnik = angular.module('sputnik', ['ngRoute', 'ngSanitize', 'ngAnimate']);

// on document ready
$(function () {
    // dataManager lets run app startup code if sure user data model is up to date
    dataManager(initApp);
});

function initApp(userDataPath, currentDataModelVersion) {
    
    sputnik.config(function ($provide, $routeProvider) {
        
        var config = initSputnikConfig(userDataPath, currentDataModelVersion);
        
        // initiating modules for injection into angular
        
        $provide.value('config', config);
        
        var feedsStorage = require('./models/feedsStorage');
        var dataPath = config.dataHomeFolder + '/feeds.json';
        $provide.value('feedsStorage', feedsStorage.make(dataPath));
        
        var articlesStorage = require('./models/articlesStorage');
        var dbPath = config.dataHomeFolder + '/articles.nedb';
        $provide.value('articlesStorage', articlesStorage.make(dbPath));
        
        $provide.value('feedsWaitingRoom', require('./helpers/feedsWaitingRoom').init(config.dataHomeFolder + '/feeds-waiting-room'));
        
        var gui = require('nw.gui');
        var net = require('./helpers/net');
        net.proxyDiscoveryFunc(gui.App.getProxyForURL);
        $provide.value('net', net);
        
        $provide.value('opml', require('./helpers/opml'));
        $provide.value('feedParser', require('./helpers/feedParser'));
        
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
    
    // Registering directives
    
    sputnik.directive('articlesList', articlesListDirective);
    sputnik.directive('dropdown', dropdownDirective);
    sputnik.directive('pickTagMenu', pickTagMenuDirective);
    
    sputnik.directive('organizeCategory', organizeCategoryDirective);
    sputnik.directive('organizeFeed', organizeFeedDirective);
    
    // Registering services
    
    sputnik.factory('articlesService', articlesService);
    sputnik.factory('downloadService', downloadService);
    sputnik.factory('faviconsService', faviconsService);
    sputnik.factory('feedsService', feedsService);
    sputnik.factory('updateService', updateService);
    
    // Bootstrap angular
    
    angular.bootstrap(document.documentElement, ['sputnik']);
    
}