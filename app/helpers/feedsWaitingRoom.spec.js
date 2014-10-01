import feedsWaitingRoom from './feedsWaitingRoom';

var jetpack = require('fs-jetpack');

describe('feedsWaitingRoom', function () {
    
    var testPath = 'temp/feeds-waiting';
    
    beforeEach(function () {
        jetpack.dir(testPath, { empty: true });
    });
    
    it("should store and give back", function (done) {
        var fwr = feedsWaitingRoom.init(testPath);
        
        var files = jetpack.list(testPath);
        expect(files.length).toBe(0);
        
        fwr.storeOne('http://site.com/elo', new Buffer('abcŁŹŃ'))
        .then(function () {
            var files = jetpack.list(testPath);
            expect(files.length).toBe(1);
            return fwr.getOne();
        })
        .then(function (result) {
            var files = jetpack.list(testPath);
            expect(files.length).toBe(0);
            expect(Buffer.isBuffer(result.data)).toBe(true);
            expect(result.url).toBe('http://site.com/elo');
            expect(result.data.toString()).toBe('abcŁŹŃ');
            done();
        });
    });
    
    it("getOne() should return error if datastore empty", function (done) {
        var fwr = feedsWaitingRoom.init(testPath);
        
        var files = jetpack.list(testPath);
        expect(files.length).toBe(0);
        
        return fwr.getOne()
        .catch(done);
    });
    
});