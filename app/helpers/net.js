var Q = require('q');
var request = require('request');
var zlib = require('zlib');

var proxyFunc;

var proxyDiscoveryFunc = function (func) {
    proxyFunc = func;
};

var getUrl = function (url, options) {
    var deferred = Q.defer();
    
    options = options || {};
    
    options.url = url;
    options.encoding = null;
    options.headers = {
        "User-Agent": "Sputnik News Reader",
        "Accept-Encoding": "gzip, deflate",
    };
    
    if (!options.timeout) {
        options.timeout = 20000;
    }
    
    try {
        if (proxyFunc) {
            // returns PAC file format
            var proxy = proxyFunc(url);
            if (proxy.substring(0, 5) === 'PROXY') {
                var endIndex = proxy.indexOf(';');
                if (endIndex === -1) {
                    endIndex = proxy.length;
                }
                proxy = proxy.substring(6, endIndex);
                options.proxy = 'http://' + proxy;
            }
        }
        
        request(options, function (err, response, body) {
            if (err) {
                deferred.reject(err);
            } else if (response.statusCode === 404) {
                deferred.reject({
                    code: '404'
                });
            } else if (response.statusCode !== 200) {
                deferred.reject({
                    code: 'unknownError'
                });
            } else {
                // if response came compressed
                var encoding = response.headers['content-encoding'];
    
                if (encoding === 'gzip') {
                    zlib.gunzip(body, function (err, decoded) {
                        deferred.resolve(decoded);
                    });
                } else if (encoding === 'deflate') {
                    zlib.inflate(body, function (err, decoded) {
                        deferred.resolve(decoded);
                    });
                } else {
                    deferred.resolve(body);
                }
            }
        }).on('error', function (err) {
            // nothing
        });
    } catch (err) {
        // nothing
    }
    
    return deferred.promise;
};

export default {
   proxyDiscoveryFunc: proxyDiscoveryFunc,
   getUrl: getUrl,
};