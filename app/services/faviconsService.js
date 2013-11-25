'use strict';

function faviconsService(config, net, $rootScope) {
    
    var cheerio = require('cheerio');
    var urlUtil = require('url');
    var Q = require('q');
    var crypto = require('crypto');
    var fs = require('fs');
    
    var storeDir = config.dataHomeFolder + '/favicons';
    
    function findFaviconInHtml(siteUrl, body) {
        var dom = cheerio.load(body);
        var href = dom('link[rel="icon"]').attr('href');
        if (!href) {
            href = dom('link[rel="shortcut icon"]').attr('href');
        }
        if (!href) {
            href = dom('link[rel="Shortcut Icon"]').attr('href');
        }
        if (href && !href.match(/^http/)) { // is relative, so make absolute
            href = urlUtil.resolve(siteUrl, href);
        }
        return href;
    }
    
    function discoverImageType(buf) {
        if (buf.length < 5) {
            return false;
        }
        if (buf.readUInt16LE(0) === 0 && buf.readUInt16LE(2) === 1) {
            return 'ico';
        }
        if (buf.slice(1, 4).toString() === 'PNG') {
            return 'png';
        }
        if (buf.slice(0, 3).toString() === 'GIF') {
            return 'gif';
        }
        return false;
    }
    
    function getFavicon(url) {
        var deferred = Q.defer();
        
        net.getUrl(url)
        .then(function (buf) {
            var imageType = discoverImageType(buf);
            if (imageType) {
                deferred.resolve({
                    faviconBytes: buf,
                    format: imageType
                });
            } else {
                deferred.reject();
            }
        }, deferred.reject);
        
        return deferred.promise;
    }
    
    function blindTryFaviconUrls(siteUrl) {
        var deferred = Q.defer();
        var url = urlUtil.parse(siteUrl);
        // first try with full url
        var testUrl = urlUtil.resolve(url.href, '/favicon.ico');
        getFavicon(testUrl).then(deferred.resolve, function () {
            // second try in root folder of a domain
            testUrl = urlUtil.resolve(url.protocol + '//' + url.host, '/favicon.ico');
            getFavicon(testUrl).then(deferred.resolve, deferred.reject);
        });
        return deferred.promise;
    }
    
    function getFaviconForSite(siteUrl) {
        var deferred = Q.defer();
        net.getUrl(siteUrl)
        .then(function (body) {
            body = body.toString();
            var faviconUrl = findFaviconInHtml(siteUrl, body);
            if (faviconUrl) {
                getFavicon(faviconUrl)
                .then(deferred.resolve, function () {
                    blindTryFaviconUrls(siteUrl)
                    .then(deferred.resolve, deferred.reject);
                });
            } else {
                blindTryFaviconUrls(siteUrl)
                .then(deferred.resolve, deferred.reject);
            }
        });
        return deferred.promise;
    }
    
    function deleteFaviconIfHas(feed) {
        if (feed.favicon) {
            fs.unlink(feed.favicon, function (err) {});
            feed.favicon = undefined;
        }
    }
    
    function updateOne(feed) {
        var deferred = Q.defer();
        
        getFaviconForSite(feed.siteUrl)
        .then(function (result) {
            if (!fs.existsSync(storeDir)) {
                fs.mkdirSync(storeDir);
            }
            var filename = crypto.createHash('md5').update(feed.url).digest('hex') + '.' + result.format;
            var filePath = storeDir + '/' + filename;
            fs.writeFile(filePath, result.faviconBytes, function (err) {
                feed.favicon = filename;
                $rootScope.$broadcast('faviconUpdated');
                deferred.resolve();
            });
        }, function () {
            // apparently there was favicon, but not anymore
            deleteFaviconIfHas(feed);
            deferred.resolve();
        });
        
        return deferred.promise;
    }
    
    function updateMany(feeds) {
        feeds = feeds.concat();
        
        function next() {
            if (feeds.length > 0) {
                updateOne(feeds.pop()).then(next);
            }
        }
        
        next();
    }
    
    return  {
        getFaviconForSite: getFaviconForSite,
        updateOne: updateOne,
        updateMany: updateMany,
        deleteFaviconIfHas: deleteFaviconIfHas,
    };
    
}