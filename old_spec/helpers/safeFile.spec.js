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
        
        var sf = safeFile(testPath);
        sf.write('abcŁŹŃ')
        .then(function () {
            return sf.read();
        })
        .then(function (data) {
            expect(data).toBe('abcŁŹŃ');
            done = true;
        }, function (err) {console.log(err)});
        waitsFor(function () { return done; }, null, 200);
    });
    
    it("should return null if both files doesn't exit", function () {
        var done = false;
        
        var sf = safeFile(testPath);
        sf.read()
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
        
        var sf = safeFile(testPath);
        sf.read()
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
        
        var sf = safeFile(testPath);
        sf.read()
        .then(function (data) {
            expect(data).toBe('123');
            done = true;
        }, function (err) {console.log(err)});
        waitsFor(function () { return done; }, null, 200);
    });
    
    it("should restore backup if main file doesn't exist", function () {
        var done = false;
        
        fse.writeFileSync(backupPath, 'qwe');
        
        var sf = safeFile(testPath);
        sf.read()
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
        
        var sf = safeFile(testPath);
        sf.read()
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
        
        var sf = safeFile(testPath);
        sf.read()
        .then(function (data) {
            expect(data).toBe('qwe');
            done = true;
        }, function (err) {console.log(err)});
        waitsFor(function () { return done; }, null, 200);
    });
    
    it("queues concurrent tasks", function () {
        var done = false;
        
        fse.writeFileSync(testPath, 'abc');
        
        var sf = safeFile(testPath);
        sf.write('123');
        // if 2 concurrent writes of different length will fire at the same time
        // they can appear as merged
        sf.write('456 456');
        sf.write('789')
        .then(function () {
            return sf.read();
        })
        .then(function (data) {
            expect(data).toBe('789');
            done = true;
        });
        waitsFor(function () { return done; }, null, 200);
    });
    
});