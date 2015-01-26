var jetpack = require('fs-jetpack');
var pathUtil = require('path');
var crypto = require('crypto');
var gui = require('nw.gui');

export default function() {

    var userDataStorageDir = pathUtil.resolve(gui.App.dataPath, 'userdata_v2');
    var configPath = userDataStorageDir + '/config.json';

    console.log('Storing data in: ' + userDataStorageDir);

    var appConf = gui.App.manifest.config;
    var userConf = jetpack.read(configPath, 'json', { safe: true }) || {};

    var setUserConfProperty = function (key, value) {
        userConf[key] = value;
        jetpack.write(configPath, userConf, { safe: true });
    }

    // Default values

    if (!userConf.guid) {
        // GUID is unique ID of this Sputnik instance,
        // just for very basic analytics stuff.
        setUserConfProperty('guid', crypto.randomBytes(16).toString('hex'));
    }
    if (userConf.keepArticlesForMonths === undefined) {
        setUserConfProperty('keepArticlesForMonths', 12);
    }

    return {
        get version() { return gui.App.manifest.version; },
        get developmentMode() { return gui.App.manifest.developmentMode; },
        get userDataStorageDir() { return userDataStorageDir; },

        get websiteUrl() { return appConf.websiteUrl; },
        get analyticsUrl() { return appConf.analyticsUrl; },
        get checkUpdatesUrl() { return appConf.checkUpdatesUrl; },

        get guid() { return userConf.guid;},

        get keepArticlesForMonths() { return userConf.keepArticlesForMonths; },
        set keepArticlesForMonths(value) {
            setUserConfProperty('keepArticlesForMonths', value);
        },

    };
};
