import safeFile from 'helpers/safeFile';

var jetpack = require('fs-jetpack');

describe('safeFile', function () {
    
    var testPath = 'temp/abc.txt';
    var backupPath = testPath + '~';
    var tmpPath = testPath + '~~';
    
    beforeEach(function () {
        jetpack.dir('temp', { empty: true });
    });
    
    it("should write and read", function (done) {
        // write all files to test if can overwrite
        jetpack.file(testPath, { content: 'test' });
        jetpack.file(backupPath, { content: 'bkp' });
        jetpack.file(tmpPath, { content: 'tmp' });
        
        var sf = safeFile(testPath);
        sf.write('abcŁŹŃ')
        .then(function () {
            return sf.read();
        })
        .then(function (data) {
            expect(data).toBe('abcŁŹŃ');
            done();
        }, function (err) {console.log(err)});
    });
    
    it("should return null if both files doesn't exit", function (done) {
        var sf = safeFile(testPath);
        sf.read()
        .then(function (data) {
            expect(data).toBeNull();
            done();
        }, function (err) {console.log(err)});
    });
    
    it("should return null if both files empty", function (done) {
        jetpack.file(testPath, { empty: true });
        jetpack.file(backupPath, { empty: true });
        
        var sf = safeFile(testPath);
        sf.read()
        .then(function (data) {
            expect(data).toBeNull();
            done();
        }, function (err) {console.log(err)});
    });
    
    it("should restore backup if main file empty", function (done) {
        jetpack.file(testPath, { empty: true });
        jetpack.file(backupPath, { content: '123' });
        
        var sf = safeFile(testPath);
        sf.read()
        .then(function (data) {
            expect(data).toBe('123');
            done();
        }, function (err) {console.log(err)});
    });
    
    it("should restore backup if main file doesn't exist", function (done) {
        jetpack.file(backupPath, { content: 'qwe' });
        
        var sf = safeFile(testPath);
        sf.read()
        .then(function (data) {
            expect(data).toBe('qwe');
            done();
        }, function (err) {console.log(err)});
    });
    
    it("should return main file if not empty (backup empt)", function (done) {
        jetpack.file(testPath, { content: 'qwe' });
        jetpack.file(backupPath, { empty: true });
        
        var sf = safeFile(testPath);
        sf.read()
        .then(function (data) {
            expect(data).toBe('qwe');
            done();
        }, function (err) {console.log(err)});
    });
    
    it("should return main file if not empty (backup has data)", function (done) {
        jetpack.write(testPath, 'qwe');
        jetpack.write(backupPath, '123');
        
        var sf = safeFile(testPath);
        sf.read()
        .then(function (data) {
            expect(data).toBe('qwe');
            done();
        }, function (err) {console.log(err)});
    });
    
    it("queues concurrent tasks", function (done) {
        jetpack.write(testPath, 'abc');
        
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
            done();
        });
    });
    
});