'use strict';

describe('safeFile', function () {
    
    var fse = require('fs-extra');
    var safeFile = require('../app/helpers/safeFile');
    
    if (!fse.existsSync('temp')) {
        fse.mkdirsSync('temp');
    }
    
    var testPath = 'temp/abc.txt';
    var backupPath = testPath + '~';
    var tmpPath = testPath + '~~';
    
    beforeEach(function () {
        if (fse.existsSync(testPath)) {
            fse.removeSync(testPath);
        }
        if (fse.existsSync(backupPath)) {
            fse.removeSync(backupPath);
        }
        if (fse.existsSync(tmpPath)) {
            fse.removeSync(tmpPath);
        }
    });
    
    it("should write and read", function () {
        var done = false;
        
        // write all files to test if can overwrite
        fse.writeFileSync(testPath, 'test');
        fse.writeFileSync(backupPath, 'bkp');
        fse.writeFileSync(tmpPath, 'tmp');
        
        safeFile.write(testPath, 'abcŁŹŃ')
        .then(function () {
            return safeFile.read(testPath);
        })
        .then(function (data) {
            expect(data).toBe('abcŁŹŃ');
            done = true;
        }, function (err) {console.log(err)});
        waitsFor(function () { return done; }, null, 200);
    });
    
    it("should return null if both files doesn't exit", function () {
        var done = false;
        
        safeFile.read(testPath)
        .then(function (data) {
            expect(data).toBeNull();
            done = true;
        }, function (err) {console.log(err)});
        waitsFor(function () { return done; }, null, 200);
    });
    
    it("should return null if both files empty", function () {
        var done = false;
        
        fse.writeFileSync(testPath, '');
        fse.writeFileSync(backupPath, '');
        
        safeFile.read(testPath)
        .then(function (data) {
            expect(data).toBeNull();
            done = true;
        }, function (err) {console.log(err)});
        waitsFor(function () { return done; }, null, 200);
    });
    
    it("should restore backup if main file empty", function () {
        var done = false;
        
        fse.writeFileSync(testPath, '');
        fse.writeFileSync(backupPath, '123');
        
        safeFile.read(testPath)
        .then(function (data) {
            expect(data).toBe('123');
            done = true;
        }, function (err) {console.log(err)});
        waitsFor(function () { return done; }, null, 200);
    });
    
    it("should restore backup if main file doesn't exist", function () {
        var done = false;
        
        fse.writeFileSync(backupPath, 'qwe');
        
        safeFile.read(testPath)
        .then(function (data) {
            expect(data).toBe('qwe');
            done = true;
        }, function (err) {console.log(err)});
        waitsFor(function () { return done; }, null, 200);
    });
    
    it("should return main file if not empty (backup empt)", function () {
        var done = false;
        
        fse.writeFileSync(testPath, 'qwe');
        fse.writeFileSync(backupPath, '');
        
        safeFile.read(testPath)
        .then(function (data) {
            expect(data).toBe('qwe');
            done = true;
        }, function (err) {console.log(err)});
        waitsFor(function () { return done; }, null, 200);
    });
    
    it("should return main file if not empty (backup has data)", function () {
        var done = false;
        
        fse.writeFileSync(testPath, 'qwe');
        fse.writeFileSync(backupPath, '123');
        
        safeFile.read(testPath)
        .then(function (data) {
            expect(data).toBe('qwe');
            done = true;
        }, function (err) {console.log(err)});
        waitsFor(function () { return done; }, null, 200);
    });
    
});