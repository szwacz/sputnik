/**
 * Favicons manager.
 * Scouts for sites' favicons and saves them locally.
 */

export default function (config, $http, $rootScope, $q) {
    
    var cheerio = require('cheerio');
    var urlUtil = require('url');
    var pathUtil = require('path');
    var crypto = require('crypto');
    var fs = require('fs');
    
    var storeDir = pathUtil.join(config.dataHomeFolder, 'favicons');
    
    fs.exists(storeDir, function (exists) {
        if (!exists) {
            fs.mkdir(storeDir);
        }
    });
    
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
        var def = $q.defer();
        
        if (url) {
            
            $http.get(url, { responseType: 'arraybuffer' })
            .then(function (response) {
                if (response.data) {
                    var buf = new Buffer(new Uint8Array(response.data));
                    var imageType = discoverImageType(buf);
                    if (imageType) {
                        def.resolve({
                            faviconBytes: buf,
                            format: imageType
                        });
                    } else {
                        def.reject();
                    }
                } else {
                    def.reject();
                }
            }, def.reject);
            
        } else {
            def.reject();
        }
        
        return def.promise;
    }
    
    function blindTryFaviconUrls(siteUrl) {
        var def = $q.defer();
        
        var url = urlUtil.parse(siteUrl);
        // first try with full url
        getFavicon(urlUtil.resolve(url.href, '/favicon.ico'))
        .then(def.resolve, function () {
            // second try in root folder of a domain
            return getFavicon(urlUtil.resolve(url.protocol + '//' + url.host, '/favicon.ico'));
        })
        .then(def.resolve, def.reject);
        
        return def.promise;
    }
    
    function getFaviconForSite(siteUrl) {
        var def = $q.defer();
        
        if (!siteUrl) {
            def.reject()
        } else {
            // get site's HTML
            $http.get(siteUrl)
            .then(function (response) {
                // look for favicon in this HTML
                return getFavicon(findFaviconInHtml(siteUrl, response.data))
            })
            .then(def.resolve, function () {
                // if favicon not found this way, try the old way
                // (default url where favicon should be stored)
                return blindTryFaviconUrls(siteUrl);
            })
            .then(def.resolve, def.reject);
        }
        
        return def.promise;
    }
    
    function deleteFaviconIfHas(feed) {
        if (feed.favicon) {
            fs.unlink(pathUtil.join(storeDir, feed.favicon), function (err) {});
            feed.favicon = undefined;
        }
    }
    
    function updateOne(feed) {
        var def = $q.defer();
        
        getFaviconForSite(feed.siteUrl)
        .then(function (result) {
            // create unique filename for this file
            var md5 = crypto.createHash('md5').update(feed.url).update(result.faviconBytes).digest('hex');
            var filename = md5 + '.' + result.format;
            if (filename !== feed.favicon) {
                // old favicon has different name, so delete it
                deleteFaviconIfHas(feed);
                var filePath = pathUtil.join(storeDir, filename);
                fs.writeFile(filePath, result.faviconBytes, function (err) {
                    feed.favicon = filename;
                    $rootScope.$broadcast('faviconUpdated');
                    def.resolve();
                });
            } else {
                def.resolve();
            }
        }, function () {
            // apparently there was favicon, but not anymore
            deleteFaviconIfHas(feed);
            def.resolve();
        });
        
        return def.promise;
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
        updateOne: updateOne,
        updateMany: updateMany,
        deleteFaviconIfHas: deleteFaviconIfHas,
    };
    
}