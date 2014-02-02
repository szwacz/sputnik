/**
 * Safely saves (and reads) file on disk.
 * No dataloss possible if application or system srashed during save.
 */

'use strict';

var Q = require('q');
var fs = require('fs');

var qRename = Q.denodeify(fs.rename);
var qReadFile = Q.denodeify(fs.readFile);
var qWriteFile = Q.denodeify(fs.writeFile);
var qUnlink = Q.denodeify(fs.unlink);
var qStat = Q.denodeify(fs.stat);

module.exports.read = function (path) {
    var def = Q.defer();
    
    var bkp = path + '~';
    
    function isFileOk(pathToExamine) {
        var def = Q.defer();
        
        // check if file exists
        qStat(pathToExamine)
        .then(function (stat) {
            // file size must be more than zero
            if (stat.size > 0) {
                def.resolve(pathToExamine);
            } else {
                def.reject();
            }
        }, def.reject);
        
        return def.promise;
    }
    
    function readIt(pathToRead) {
        qReadFile(pathToRead, { encoding: 'utf8' })
        .then(def.resolve, def.reject);
    }
    
    isFileOk(path)
    .then(readIt, function () {
        // if main file not OK, check backup
        isFileOk(bkp)
        .then(readIt, function () {
            // file doesn't exist, return null, no need to throw an error
            def.resolve(null);
        });
    });
    
    return def.promise;
};

module.exports.write = function (path, data) {
    var def = Q.defer();
    
    var bkp = path + '~';
    var tmp = path + '~~';
    
    // rename current file as backup (if exists)
    qRename(path, bkp)
    .finally(function () {
        // write to temp location
        qWriteFile(tmp, data)
        .then(function () {
            // rename saved temp file as main
            return qRename(tmp, path);
        })
        .then(function () {
            // delete backup file
            return qUnlink(bkp);
        })
        .finally(function () {
            def.resolve();
        });
    });
    
    return def.promise;
};