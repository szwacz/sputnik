var jetpack = require('fs-jetpack');
var pathUtil = require('path');
var crypto = require('crypto');
var gui = require('nw.gui');

export default function() {

    var userDataStorageDir = pathUtil.resolve(gui.App.dataPath, 'userdata_v2');

    var appConf = gui.App.manifest.config;
    var userConf = jetpack.read(userDataStorageDir + '/config.json', 'json', { safe: true }) || {};

    var setUserConfProperty = function (key, value) {
        userConf[key] = value;
        jetpack.write(userConf, { safe: true });
    }

    // Default values

    if (!userConf.guid) {
        // GUID is unique ID of this Sputnik instance,
        // just for very basic analytics stuff.
        setUserConfProperty('guid', crypto.randomBytes(16).toString('hex'));
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

    return {
        get version() { return gui.App.manifest.version; },
        get developmentMode() { return gui.App.manifest.developmentMode; },
        get userDataStorageDir() { return userDataStorageDir; },

        get websiteUrl() { return appConf.websiteUrl; },
        get websiteUrlUpdate() { return appConf.websiteUrlUpdate; },
        get analyticsUrl() { return appConf.analyticsUrl; },
        get checkUpdatesUrl() { return appConf.checkUpdatesUrl; },

        get guid() { return userConf.guid;},

        get articlesPerPage() { return userConf.articlesPerPage; },
        set articlesPerPage(value) {
            setUserConfProperty('articlesPerPage', value);
        },

        get lastFeedsDownload() { return userConf.lastFeedsDownload; },
        set lastFeedsDownload(value) {
            setUserConfProperty('lastFeedsDownload', value);
        },

        get keepArticlesForMonths() { return userConf.keepArticlesForMonths; },
        set keepArticlesForMonths(value) {
            setUserConfProperty('keepArticlesForMonths', value);
        },

        get keepTaggedArticlesForever() { return userConf.keepTaggedArticlesForever; },
        set keepTaggedArticlesForever(value) {
            setUserConfProperty('keepTaggedArticlesForever', value);
        },
    };
};
