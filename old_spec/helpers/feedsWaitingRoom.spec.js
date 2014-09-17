'use strict';

describe('feedsWaitingRoom', function () {
    
    var fse = require('fs-extra');
    var feedsWaitingRoom = require('../app/helpers/feedsWaitingRoom');
    
    if (!fse.existsSync('temp')) {
        fse.mkdirsSync('temp');
    }
    
    var testPath = 'temp/feeds-waiting';
    
    beforeEach(function () {
        if (fse.existsSync(testPath)) {
            fse.removeSync(testPath);
        }
    });
    
    it("should store and give back", function () {
        var done = false;
        var fwr = feedsWaitingRoom.init(testPath);
        
        var files = fse.readdirSync(testPath);
        expect(files.length).toBe(0);
        
        fwr.storeOne('http://site.com/elo', new Buffer('abcŁŹŃ'))
        .then(function () {
            var files = fse.readdirSync(testPath);
            expect(files.length).toBe(1);
            return fwr.getOne();
        })
        .then(function (result) {
            var files = fse.readdirSync(testPath);
            expect(files.length).toBe(0);
            expect(Buffer.isBuffer(result.data)).toBe(true);
            expect(result.url).toBe('http://site.com/elo');
            expect(result.data.toString()).toBe('abcŁŹŃ');
            done = true;
        });
        waitsFor(function () { return done; }, null, 500);
    });
    
    it("getOne() should return error if datastore empty", function () {
        var done = false;
        var fwr = feedsWaitingRoom.init(testPath);
        
        var files = fse.readdirSync(testPath);
        expect(files.length).toBe(0);
        
        return fwr.getOne()
        .then(null, function () {
            done = true;
        });
        waitsFor(function () { return done; }, null, 500);
    });
    
});