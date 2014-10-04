/**
 * Manages user-specyfic settings, and exposes environment variables to other code.
 * - reads from file app/appConfig.json
 * - reads and writes to file userdata/config.json
 */
import safeFile from './helpers/safeFile';

export default function(userDataPath, currentDataModelVersion, callback) {
    
    var fs = require('fs');
    var gui = require('nw.gui');
    
    function generateGuid() {
        var crypto = require('crypto');
        var rand = crypto.randomBytes(8).toString('hex');
        var now = Date.now().toString();
        return crypto.createHash('md5').update(rand + now).digest('hex');
    }
    
    var appConf = gui.App.manifest.config;
    
    var userConf = {};
    var userConfFile = safeFile(userDataPath + '/config.json');
    
    function setUserConfProperty(key, value) {
        userConf[key] = value;
        userConfFile.write(JSON.stringify(userConf, null, 4));
    }
    
    var api = {
        get version() {
            return gui.App.manifest.version;
        },
        get dataHomeFolder() {
            return userDataPath;
        },
        
        get websiteUrl() {
            return appConf.websiteUrl;
        },
        get websiteUrlUpdate() {
            return appConf.websiteUrlUpdate;
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
    
    userConfFile.read()
    .then(function (data) {
        if (data !== null) {
            userConf = JSON.parse(data);
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
        
        callback(api);
    });
};