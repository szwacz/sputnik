/**
 * Script to build and package for Linux platform.
 * External dependencies:
 * makeself - https://github.com/megastep/makeself
 */

'use strict';

var utils = require('./utils');
var fs = require('fs');
var pathUtil = require('path');
var wrench = require('wrench');
var childProcess = require('child_process');

var platform = 'linux';

var projectPath = pathUtil.resolve(__dirname, '..');
var releasePath = pathUtil.resolve(projectPath, '..', 'release');
var workingPath = pathUtil.resolve(releasePath, 'sputnik-linux-pack');

var buildPath = workingPath + '/Sputnik';

var runtimeSource = projectPath + '/nw/linux';
var runtimeDestination = buildPath;
var appSource = projectPath + '/app';
var appDestination = runtimeDestination;

var version = JSON.parse(fs.readFileSync(appSource + '/package.json')).version;

console.log('Releasing Sputnik v' + version + ' for Linux');

// Cleaning the working directory 
utils.cleanFolder(workingPath);

//-----------------------------------------------
// Building app folder
//-----------------------------------------------

console.log('Building app...');

//wrench.mkdirSyncRecursive(buildPath);
wrench.copyDirSyncRecursive(appSource, appDestination);

utils.copyFile(runtimeSource + '/nw', runtimeDestination + '/sputnik');
utils.copyFile(runtimeSource + '/nw.pak', runtimeDestination + '/nw.pak');
//utils.copyFile(runtimeSource + '/libffmpegsumo.so', runtimeDestination + '/libffmpegsumo.so');

utils.copyFile(projectPath + '/src/release/linux/install.sh', workingPath + '/install.sh');
utils.copyFile(projectPath + '/src/release/linux/Sputnik.desktop', workingPath + '/Sputnik.desktop');
utils.copyFile(projectPath + '/src/release/linux/sputnik.sh', appDestination + '/sputnik.sh');

utils.setProductionValues(appDestination, platform);

//-----------------------------------------------
// Creating package
//-----------------------------------------------

console.log('Creating package...');

var packageName = 'Sputnik-v' + version + '.run';
var releaseFinalPath = releasePath + '/' + packageName;
var installScript = 'bash ./install.sh';
var label = '"Sputnik"';

// removing previous package file if exists
if (fs.existsSync(releaseFinalPath)) {
    fs.unlinkSync(releaseFinalPath);
}

childProcess.exec("bash " + __dirname + "/makeself/makeself.sh " + workingPath + " " + releaseFinalPath + " " + label + ' ' + installScript,
function (error, stdout, stderr) {
    if (error) {
        console.log(error);
        return;
    }
    
    console.log('Done!');
});

//-----------------------------------------------
// Update release manifest file
//-----------------------------------------------

utils.updateJson(releasePath + '/manifest.json', {
    version: version,
    linuxPackage: packageName,
});