/**
 * Checks if data model is up to date.
 * Migrates legacy data models to current version.
 */

export default function (callback) {
    
    var gui = require('nw.gui');
    var fs = require('fs');
    var Q = require('q');
    
    function getConfigPath() {
        var path;
        var legacyPath;
        
        // first look into place if datamodel > 0
        if (process.platform === 'win32') {
            path = '..\\userdata\\config.json';
        } else {
            path = gui.App.dataPath + '/userdata/config.json';
        }
        if (fs.existsSync(path)) {
            return path;
        }
        
        // then look for legacy datamodel == 0
        // last version with this data model was 1.0.2
        if (process.platform === 'win32') {
            legacyPath = '..\\data\\config.json';
        } else {
            legacyPath = gui.App.dataPath + '/config.json';
        }
        if (fs.existsSync(legacyPath)) {
            return legacyPath;
        }
        
        // if legacy also doesn't exist it means there is no data yet, and new path apply
        return path;
    }
    
    function getUserDataPath() {
        if (process.platform === 'win32') {
            return '..\\userdata';
        }
        return gui.App.dataPath + '/userdata';
    }
    
    //---------------------------------------------------------------
    // Data model ugrades
    //---------------------------------------------------------------
    
    var upgradeFrom = [];
    
    /**
     * Upgrade from 0 to 1.
     * - user data are stored in 'userdata' folder the same way across all platforms
     * - smarter favicons paths stored in feeds.json
     */
    upgradeFrom[0] = function (callback) {
        
        var pathUtil = require('path');
        var qRename = Q.denodeify(fs.rename);
        
        function fixFavicons(feedsPath) {
            // change favicon urls
            var feeds = JSON.parse(fs.readFileSync(feedsPath, { encoding: 'utf8' }));
            feeds.feeds.forEach(function (feed) {
                if (feed.favicon) {
                    // favicons are like so:
                    // '../data/favicons/488dcba56f854f8a8c61ba3b29560ae9.ico'
                    // must strip folders and leave only filename
                    feed.favicon = pathUtil.basename(feed.favicon);
                }
            });
            fs.writeFile(feedsPath, JSON.stringify(feeds, null, 4), { encoding: 'utf8' });
        }
        
        if (process.platform === 'win32') {
            // Windows
            // Data was stored in 'data' folder, we want to have on all
            // platforms data in folder 'userdata'.
            
            qRename('..\\data', '..\\userdata')
            .then(function () {
                fixFavicons('..\\userdata\\feeds.json');
                callback();
            }, function (e) {
                console.log(e);
            });
            
        } else {
            // OSX, Linux
            // Data was stored in dataPath, we want to move them to dataPath + '/userdata'.
            
            var currPath = gui.App.dataPath;
            var newPath = gui.App.dataPath + '/userdata';
            
            fs.mkdirSync(newPath);
            
            qRename(currPath + '/config.json', newPath + '/config.json')
            .then(function () {
                return qRename(currPath + '/feeds.json', newPath + '/feeds.json');
            })
            .then(function () {
                return qRename(currPath + '/articles.nedb', newPath + '/articles.nedb');
            })
            .fin(function () {
                return qRename(currPath + '/feeds-waiting-room', newPath + '/feeds-waiting-room');
            })
            .fin(function () {
                // favicons dir might not exist
                return qRename(currPath + '/favicons', newPath + '/favicons');
            })
            .fin(function () {
                fixFavicons(newPath + '/feeds.json');
                callback();
            });
        }
    };
    
    function upgradeDataModel(callback) {
        
        function next() {
            if (currentDataModelVersion < appDataModelVersion) {
                var upgradeFunc = upgradeFrom[currentDataModelVersion];
                upgradeFunc(function () {
                    currentDataModelVersion += 1;
                    next();
                })
            } else {
                callback();
            }
        }
        
        next();
    }
    
    //---------------------------------------------------------------
    // Init
    //---------------------------------------------------------------
    
    // represents model version supported by application code
    var appDataModelVersion = 1;
    // represents version found on this machine, defaults to latest
    var currentDataModelVersion = appDataModelVersion;
    
    var userDataPath = getUserDataPath();
    
    try {
        var config = JSON.parse(fs.readFileSync(getConfigPath()), { encoding: 'utf8' });
        // real data model version read from config
        currentDataModelVersion = config.dataModelVersion || 0;
    } catch(e) {
        // means file doesn't exist, no problem
    }
    
    if (currentDataModelVersion < appDataModelVersion) {
        // data model is obsolete, needs upgrade
        upgradeDataModel(function () {
            setTimeout(function () {
                // don't know why this timeout is needed but without it angular won't start
                callback(userDataPath, currentDataModelVersion);
            }, 1);
        });
    } else {
        // data model already up to date
        // ...or doesn't exist yet
        
        if (!fs.existsSync(userDataPath)) {
            fs.mkdirSync(userDataPath);
        }
        
        setTimeout(function () {
            // don't know why this timeout is needed but without it angular won't start
            callback(userDataPath, currentDataModelVersion);
        }, 1);
    }
};