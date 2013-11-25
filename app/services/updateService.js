'use strict';

function updateService(config, $http) {
    
    var Q = require('q');
    
    function parseVersionString(verStr) {
        var parts = verStr.split('.');
        return {
            major: parseInt(parts[0], 10),
            minor: parseInt(parts[1], 10),
            patch: parseInt(parts[2], 10)
        }
    }
    
    /**
     * Compares given version with application version,
     * and returns true if given version is greater.
     * Only format MAJOR.MINOR.PATCH is supported.
     */
    function isNewerVersion(version) {
        var appV = parseVersionString(config.version);
        var v = parseVersionString(version);
        if (v.major > appV.major) {
            return true;
        } else if (v.major === appV.major) {
            if (v.minor > appV.minor) {
                return true;
            } else if (v.minor === appV.minor) {
                if (v.patch > appV.patch) {
                    return true;
                }
            }
        }
        return false;
    }
    
    function checkUpdates() {
        var deferred = Q.defer();
        
        $http.get(config.checkUpdatesUrl)
        .success(function (updatesData) {
            if (isNewerVersion(updatesData.version)) {
                deferred.resolve(updatesData.version);
            } else {
                deferred.reject();
            }
        });
        
        return deferred.promise;
    }
    
    return  {
        checkUpdates: checkUpdates,
        isNewerVersion: isNewerVersion
    };
    
}