export default function (config, $http) {
    
    var dailyHit = function () {
        $http.post(config.analyticsUrl, {
            type: 'dailyHit',
            guid: config.guid,
            version: config.version,
            platform: process.platform,
        });
    };
    
    return {
        dailyHit: dailyHit,
    };
}
