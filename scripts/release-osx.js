'use strict';

var utils = require('./utils');
var fs = require('fs');
var pathUtil = require('path');
var wrench = require('wrench');
var childProcess = require('child_process');

// have to stay 'macos' as legacy, don't change to 'osx'
var platform = 'macos';

var projectPath = pathUtil.resolve(__dirname, '..');
var releasePath = pathUtil.resolve(projectPath, '..', 'release');
var workingPath = pathUtil.resolve(releasePath, 'osx');

var runtimeSource = projectPath + '/nw/osx/node-webkit.app';
var runtimeDestination = workingPath + '/Sputnik.app';
var appSource = projectPath + '/app';
var appDestination = runtimeDestination + '/Contents/Resources/app.nw';

var version = JSON.parse(fs.readFileSync(appSource + '/package.json')).version;

console.log('Releasing Sputnik v' + version + ' for OSX');

// Cleaning the working directory 
utils.cleanFolder(workingPath);

//-----------------------------------------------
// Building app folder
//-----------------------------------------------

// copy node-webkit.app
wrench.copyDirSyncRecursive(runtimeSource, runtimeDestination);

// delete default node-webkit icon
fs.unlinkSync(runtimeDestination + '/Contents/Resources/nw.icns');

// copy Sputnik code into .app structure
wrench.copyDirSyncRecursive(appSource, appDestination);

// prepare app manifest file
var infoFile = fs.readFileSync(projectPath + '/src/release/osx/Info.plist', { encoding: 'utf8' });
infoFile = infoFile.replace('{{sputnikVersion}}', version);
fs.writeFileSync(runtimeDestination + '/Contents/Info.plist', infoFile);

// copy Sputnik's icon
utils.copyFile(projectPath + '/src/release/osx/icon.icns', runtimeDestination + '/Contents/Resources/icon.icns');

utils.setProductionValues(appDestination, platform);

//-----------------------------------------------
// Creating DMG file
//-----------------------------------------------

var packageName = 'Sputnik-v' + version + '.dmg';
var releaseFinalPath = releasePath + '/' + packageName;

if (fs.existsSync(releaseFinalPath)) {
    fs.unlinkSync(releaseFinalPath);
}

var dmgConfigPath = workingPath + '/appdmg.json'
var dmgConfig = {
    "title": "Sputnik",
    "app": runtimeDestination,
    "background": projectPath + "/src/release/osx/dmgBackground.png",
    "icon": projectPath + '/src/release/osx/dmgIcon.icns',
    "icons": {
        "size": 128,
        "app": [130, 200],
        "alias": [410, 200]
    }
}
utils.updateJson(dmgConfigPath, dmgConfig);

childProcess.exec("appdmg " + dmgConfigPath + " " + releaseFinalPath, function (err, stdout, stderr) {
    if (err) {
        console.log(err);
        return;
    }
    
    // update release manifest file
    utils.updateJson(releasePath + '/manifest.json', {
        version: version,
        osxPackage: packageName,
    });
    
    // remove working dir
    //wrench.rmdirSyncRecursive(workingPath);
    
    console.log('Done!');
});