var Q = require('q');

export default {
    make: function (urlMap) {
        
        var gerUrlSpy;
        
        function isTiemout(str) {
            if (str === 'http://timeout') {
                return true;
            }
            return str.substr(0, 7) === 'timeout';
        }
        
        function get(url, options) {
            var deferred = Q.defer();
            
            if (urlMap[url]) {
                deferred.resolve(new Buffer(urlMap[url]));
            } else if (isTiemout(url)) {
                deferred.reject({
                    code: 'ETIMEDOUT'
                });
            } else {
                switch (url) {
                    case 'http://404':
                        deferred.reject({
                            code: '404'
                        });
                        break;
                    case 'http://not-found':
                    case 'not-found':
                        deferred.reject({
                            code: 'ENOTFOUND'
                        });
                        break;
                    case 'connection-refused':
                        deferred.reject({
                            code: 'ECONNREFUSED'
                        });
                        break;
                    case 'unknown-error':
                    default:
                        deferred.reject({
                            code: '???'
                        });
                }
            }
            
            if (gerUrlSpy) {
                gerUrlSpy(url, options);
            }
            
            return deferred.promise;
        }
    
        return {
            getUrl: get,
            injectGeturlSpy: function (spy) {
                gerUrlSpy = spy;
            }
        };
    }
};