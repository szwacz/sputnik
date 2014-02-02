/**
 * Manages user-specyfic settings, and exposes environment variables to other code.
 * - reads from file app/appConfig.json
 * - reads and writes to file userdata/config.json
 */

'use strict';

function initSputnikConfig(userDataPath, currentDataModelVersion, callback) {
    
    var fs = require('fs');
    var gui = require('nw.gui');
    var safeFile = require('./helpers/safeFile');
    
    function generateGuid() {
        var crypto = require('crypto');
        var rand = crypto.randomBytes(8).toString('hex');
        var now = Date.now().toString();
        return crypto.createHash('md5').update(rand + now).digest('hex');
    }
    
    var appConf = JSON.parse(fs.readFileSync('./appConfig.json'));
    
    var userConf = {};
    var userConfPath = userDataPath + '/config.json';
    
    function setUserConfProperty(key, value) {
        userConf[key] = value;
        safeFile.write(userConfPath, JSON.stringify(userConf, null, 4), { encoding: 'utf8' });
    }
    
    var api = {
        get version() {
            return gui.App.manifest.version;
        },
        get dataHomeFolder() {
            return userDataPath;
        },
        
        get targetPlatform() {
            return appConf.targetPlatform;
        },
        get websiteUrl() {
            return appConf.websiteUrl;
        },
        get websiteUrlUpdate() {
            return appConf.websiteUrlUpdate;
        },
        get websiteUrlDonate() {
            return appConf.websiteUrlDonate;
        },
        get analyticsUrl() {
            return appConf.analyticsUrl;
        },
        get checkUpdatesUrl() {
            return appConf.checkUpdatesUrl;
        },
        
        get guid() {
            return userConf.guid;
        },
        get articlesPerPage() {
            return userConf.articlesPerPage;
        },
        set articlesPerPage(value) {
            setUserConfProperty('articlesPerPage', value);
        },
        get lastFeedsDownload() {
            return userConf.lastFeedsDownload;
        },
        set lastFeedsDownload(value) {
            setUserConfProperty('lastFeedsDownload', value);
        },
        get keepArticlesForMonths() {
            return userConf.keepArticlesForMonths;
        },
        set keepArticlesForMonths(value) {
            setUserConfProperty('keepArticlesForMonths', value);
        },
        get keepTaggedArticlesForever() {
            return userConf.keepTaggedArticlesForever;
        },
        set keepTaggedArticlesForever(value) {
            setUserConfProperty('keepTaggedArticlesForever', value);
        },
    };
    
    safeFile.read(userConfPath)
    .then(function (data) {
        if (data !== null) {
            userConf = JSON.parse(data);
            callback(api);
        }
        
        // default values
        
        if (!userConf.dataModelVersion || userConf.dataModelVersion !== currentDataModelVersion) {
            setUserConfProperty('dataModelVersion', currentDataModelVersion);
        }
        
        if (!userConf.guid) {
            // guid is unique ID of this app instance
            setUserConfProperty('guid', generateGuid());
        }
        
        if (userConf.articlesPerPage === undefined) {
            setUserConfProperty('articlesPerPage', 30);
        }
        if (userConf.keepArticlesForMonths === undefined) {
            setUserConfProperty('keepArticlesForMonths', 12);
        }
        if (userConf.keepTaggedArticlesForever === undefined) {
            setUserConfProperty('keepTaggedArticlesForever', true);
        }
    });
}