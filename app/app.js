'use strict';

var sputnik = angular.module('sputnik', ['ngRoute', 'ngSanitize', 'ngAnimate']);

// dataManager lets run app startup code if sure user data model is up to date
dataManager(function (userDataPath, currentDataModelVersion) {
    
    sputnik.config(function ($provide, $routeProvider) {
        
        var config = initSputnikConfig(userDataPath, currentDataModelVersion);
        
        // initiating modules
        
        $provide.value('config', config);
        
        var feedsStorage = require('./models/feedsStorage');
        var dataPath = config.dataHomeFolder + '/feeds.json';
        $provide.value('feedsStorage', feedsStorage.make(dataPath));
        
        var articlesStorage = require('./models/articlesStorage');
        var dbPath = config.dataHomeFolder + '/articles.nedb';
        $provide.value('articlesStorage', articlesStorage.make(dbPath));
        
        $provide.value('feedsWaitingRoom', require('./helpers/feedsWaitingRoom').init(config.dataHomeFolder + '/feeds-waiting-room'));
        
        $provide.value('opml', require('./helpers/opml'));
        $provide.value('net', require('./helpers/net'));
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
    
});

/**
 * Restores and saves window state (size, positon etc.).
 */
var windowStateManager = (function () {
    
    var gui = require('nw.gui');
    var win = gui.Window.get();
    var winState;
    var currWinMode;
    var resizeTimeout;
    var isMaximizationEvent = false;
    
    function initWindowState() {
        winState = JSON.parse(localStorage.windowState || 'null');
        
        if (winState) {
            currWinMode = winState.mode;
            if (currWinMode === 'maximized') {
                win.maximize();
            } else {
                // reset to safe defaults when something unusable was saved
                if (winState.x < -10 || winState.x > window.screen.width) {
                    winState.x = 0;
                }
                if (winState.y < -10 || winState.y > window.screen.height) {
                    winState.y = 0;
                }
                
                restoreWindowState();
            }
        } else {
            currWinMode = 'normal';
            
            // if nothing saved yet find best default size
            if (window.screen.width > 1024) {
                win.width = 1180;
                win.x = (window.screen.width - win.width) / 2;
            }
            if (window.screen.height > 768) {
                win.height = window.screen.height - 100;
                win.y = (window.screen.height - win.height) / 2;
            }
            
            dumpWindowState();
        }
        
        setTimeout(function () {
            win.show();
        }, 300);
    }
    
    function dumpWindowState() {
        if (!winState) {
            winState = {};
        }
        
        // we don't want to save minimized state, only maximized or normal
        if (currWinMode === 'maximized') {
            winState.mode = 'maximized';
        } else {
            winState.mode = 'normal';
        }
        
        // when window is maximized you want to preserve normal
        // window dimensions to restore them later (even between sessions)
        if (currWinMode === 'normal') {
            winState.x = win.x;
            winState.y = win.y;
            winState.width = win.width;
            winState.height = win.height;
        }
    }
    
    function restoreWindowState() {
        win.resizeTo(winState.width, winState.height);
        win.moveTo(winState.x, winState.y);
    }
    
    function saveWindowState() {
        dumpWindowState();
        localStorage.windowState = JSON.stringify(winState);
    }
    
    initWindowState();
    
    win.on('maximize', function () {
        isMaximizationEvent = true;
        currWinMode = 'maximized';
    });
    
    win.on('unmaximize', function () {
        currWinMode = 'normal';
        restoreWindowState();
    });
    
    win.on('minimize', function () {
        currWinMode = 'minimized';
    });
    
    win.on('restore', function () {
        currWinMode = 'normal';
    });
    
    win.window.addEventListener('resize', function () {
        // resize event is fired many times on one resize action,
        // this hack with setTiemout forces it to fire only once
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function () {
            
            // on MacOS you can resize maximized window, so it's no longer maximized
            if (isMaximizationEvent) {
                // first resize after maximization event should be ignored
                isMaximizationEvent = false;
            } else {
                if (currWinMode === 'maximized') {
                    currWinMode = 'normal';
                }
            }
            
            dumpWindowState();
            
        }, 500);
    }, false);
    
    return {
        save: saveWindowState
    };
    
}());