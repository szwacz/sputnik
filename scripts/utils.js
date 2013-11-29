"use strict";

var deepmerge = require('deepmerge');
var fs = require('fs');
var wrench = require('wrench');

/**
 * Overwrites given properties in JSON file.
 * If file doesn't exist will create it.
 */
function updateJson(path, properties) {
    var obj = {};
    if (fs.existsSync(path)) {
        obj = JSON.parse(fs.readFileSync(path, { encoding: 'utf8' }));
    }
    obj = deepmerge(obj, properties);
    fs.writeFileSync(path, JSON.stringify(obj, null, 4));
}

function copyFile(from, to) {
    var data = fs.readFileSync(from);
    fs.writeFileSync(to, data, {
        encoding: 'binary',
        flags: 'w'
    });
}

function cleanFolder(path) {
    if (fs.existsSync(path)) {
        wrench.rmdirSyncRecursive(path);
    } 
    wrench.mkdirSyncRecursive(path);
}

module.exports.updateJson = updateJson;
module.exports.copyFile = copyFile;
module.exports.cleanFolder = cleanFolder;

/**
 * Overwirite values in app config files from dev to production.
 */
module.exports.setProductionValues = function (appDestination, platform) {
    updateJson(appDestination + '/package.json', {
        name: 'Sputnik',
        window: {
            toolbar: false
        }
    });
    updateJson(appDestination + '/appConfig.json', {
        targetPlatform: platform,
        websiteUrl: 'http://sputnik.szwacz.com',
        websiteUrlUpdate: 'http://sputnik.szwacz.com/update/',
        websiteUrlDonate: 'http://sputnik.szwacz.com/donate/',
        analyticsUrl: 'http://sputnik.szwacz.com/analytics/hit.php',
        checkUpdatesUrl: 'http://sputnik.szwacz.com/check-updates/updates.json'
    });
};
