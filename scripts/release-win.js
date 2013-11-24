/**
 * Script to build and package for Windows platform.
 * External dependencies:
 * 7zip command line version
 */

'use strict';

var utils = require('./utils');
var fs = require('fs');
var pathUtil = require('path');
var wrench = require('wrench');
var childProcess = require('child_process');

var platform = 'windows';

var projectPath = pathUtil.resolve(__dirname, '..');
var releasePath = pathUtil.resolve(projectPath, '..', 'release');
var workingPath = pathUtil.resolve(releasePath, 'windows');

var buildPath = workingPath + '/Sputnik';

var runtimeSource = projectPath + '/nw/windows';
var runtimeDestination = buildPath + '/app';
var appSource = projectPath + '/app';
var appDestination = runtimeDestination;

var version = JSON.parse(fs.readFileSync(appSource + '/package.json')).version;

console.log('Releasing Sputnik v' + version + ' for Windows');

// Cleaning the working directory 
utils.cleanFolder(workingPath);

//-----------------------------------------------
// Building app folder
//-----------------------------------------------

console.log('Building app...');

wrench.mkdirSyncRecursive(buildPath);
wrench.copyDirSyncRecursive(appSource, appDestination);

utils.copyFile(runtimeSource + '/nw.exe', runtimeDestination + '/sputnik.exe');
utils.copyFile(runtimeSource + '/nw.pak', runtimeDestination + '/nw.pak');
utils.copyFile(runtimeSource + '/icudt.dll', runtimeDestination + '/icudt.dll');

utils.copyFile(projectPath + '/src/release/windows/sputnik.exe', appDestination + '/../sputnik.exe');

utils.setProductionValues(appDestination, platform);

//-----------------------------------------------
// Creating ZIP file
//-----------------------------------------------

console.log('Packing to ZIP archive...');

var packageName = 'Sputnik-v' + version + '.zip';
var releaseFinalPath = releasePath + '/' + packageName;

// removing previous package file if exists
if (fs.existsSync(releaseFinalPath)) {
    fs.unlinkSync(releaseFinalPath);
}

childProcess.execFile(__dirname + "/7zip/7za.exe",
    ["a", releaseFinalPath, buildPath],
    { cwd: workingPath },
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
    windowsPackage: packageName,
});