var Q = require('q');
var fs = require('fs');
var pathUtil = require('path');
var crypto = require('crypto');

var init = function (waitingPlacePath) {
    
    function storeOne(url, data) {
        var def = Q.defer();
        
        var name = crypto.pseudoRandomBytes(8).toString('hex');
        var dataPath = pathUtil.resolve(waitingPlacePath, name);
        var buf = new Buffer(2 + url.length);
        buf.writeUInt16BE(url.length, 0);
        buf.write(url, 2);
        fs.writeFile(dataPath, Buffer.concat([buf, data]), function (err) {
            def.resolve();
        });
        
        return def.promise;
    }
    
    function getOne() {
        var def = Q.defer();
        
        fs.readdir(waitingPlacePath, function (err, files) {
            if (files.length > 0) {
                var dataPath = pathUtil.resolve(waitingPlacePath, files[0]);
                fs.readFile(dataPath, function (err, buf) {
                    var urlLen = buf.readUInt16BE(0);
                    var url = buf.toString('utf8', 2, 2 + urlLen);
                    fs.unlink(dataPath, function (err) {
                        def.resolve({
                            url: url,
                            data: buf.slice(2 + urlLen)
                        });
                    });
                });
            } else {
                def.reject();
            }
        });
        
        return def.promise;
    }
    
    if (!fs.existsSync(waitingPlacePath)) {
        fs.mkdirSync(waitingPlacePath);
    }
    
    return {
        storeOne: storeOne,
        getOne: getOne
    };
};

export default {
    init: init
}