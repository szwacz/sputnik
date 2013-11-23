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

var runtimeSource = projectPath + '/nw/windows';
var runtimeDestination = workingPath + '/Sputnik/app';
var appSource = projectPath + '/app';
var appDestination = runtimeDestination;

var version = JSON.parse(fs.readFileSync(appSource + '/package.json')).version;

console.log('Releasing Sputnik v' + version + ' for Windows');

// Cleaning the working directory 
utils.cleanFolder(workingPath);

//-----------------------------------------------
// Building app folder
//-----------------------------------------------

wrench.mkdirSyncRecursive(pathUtil.resolve(appDestination, '..'));
wrench.copyDirSyncRecursive(appSource, appDestination);

utils.copyFile(runtimeSource + '/nw.exe', runtimeDestination + '/sputnik.exe');
utils.copyFile(runtimeSource + '/nw.pak', runtimeDestination + '/nw.pak');
utils.copyFile(runtimeSource + '/icudt.dll', runtimeDestination + '/icudt.dll');

utils.copyFile(projectPath + '/src/release/windows/sputnik.exe', appDestination + '/../sputnik.exe');

utils.setProductionValues(appDestination, platform);

//-----------------------------------------------
// Creating ZIP file
//-----------------------------------------------

var packageName = 'Sputnik-v' + version + '.zip';
var releaseFinalPath = releasePath + '/' + packageName;

if (fs.existsSync(releaseFinalPath)) {
    fs.unlinkSync(releaseFinalPath);
}

childProcess.execFile(__dirname + "/7zip/7za.exe",
    ["a", releaseFinalPath, workingPath ],
    { cwd: workingPath },
function (error, stdout, stderr) {
    if (error) {
        console.log(error);
        return;
    }
    
    // update release manifest file
    utils.updateJson(releasePath + '/manifest.json', {
        version: version,
        windowsPackage: packageName,
    });
    
    console.log('Done!');
});