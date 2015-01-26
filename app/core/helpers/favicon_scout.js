var urlUtil = require('url');
var Q = require('q');
var cheerio = require('cheerio');

export default function ($http) {

    var findFaviconInHtml = function (siteUrl, body) {
        var dom = cheerio.load(body);
        var href = dom('link[rel$="icon"]').attr('href');
        if (href && !href.match(/^http/)) {
            // Is relative URL, so make it absolute.
            href = urlUtil.resolve(siteUrl, href);
        }
        return href;
    }

    var discoverImageType = function (buf) {
        if (buf.length < 5) {
            return null;
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
        return null;
    }

    var scout = function (siteUrl) {
        var deferred = Q.defer();

        $http.get(siteUrl)
        .success(function (data) {
            var faviconUrl = findFaviconInHtml(siteUrl, data);
            if (faviconUrl) {
                $http.get(faviconUrl, { responseType: 'arraybuffer' })
                .success(function (data) {
                    var buf = new Buffer(new Uint8Array(data));
                    var imageType = discoverImageType(buf);
                    if (imageType) {
                        deferred.resolve({
                            bytes: buf,
                            format: imageType
                        });
                    } else {
                        deferred.reject();
                    }
                })
                .error(deferred.reject);
            } else {
                deferred.reject();
            }
        })
        .error(deferred.reject);

        return deferred.promise;
    };

    return  {
        scout: scout,
    };
}
