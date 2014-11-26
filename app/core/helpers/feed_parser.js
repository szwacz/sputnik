var Q = require('q');
var iconv = require('iconv-lite');
var FeedParser = require('feedparser');
var Stream = require('stream');

export default function () {
    
    var parseFeed = function (body) {
        var deferred = Q.defer();
        var meta;
        var articles = [];
        
        var s = new Stream();
        s.readable = true;
        
        s.pipe(new FeedParser())
        .on('error', deferred.reject)
        .on('meta', function (m) {
            meta = m;
        })
        .on('readable', function () {
            var stream = this;
            var item = stream.read();
            while (item) {
                articles.push(item);
                item = stream.read();
            }
        })
        .on('end', function () {
            deferred.resolve({
                meta: meta,
                articles: articles
            });
        });
        
        s.emit('data', body);
        s.emit('end');
        
        return deferred.promise;
    }
    
    var normalizeEncoding = function (bodyBuf) {
        var body = bodyBuf.toString();
        var encoding;
        
        var xmlDeclaration = body.match(/^<\?xml .*\?>/);
        if (xmlDeclaration) {
            var encodingDeclaration = xmlDeclaration[0].match(/encoding=("|').*?("|')/);
            if (encodingDeclaration) {
                encoding = encodingDeclaration[0].substring(10, encodingDeclaration[0].length - 1);
            }
        }
        
        if (encoding && encoding.toLowerCase() !== 'utf-8') {
            try {
                body = iconv.decode(bodyBuf, encoding);
            } catch (err) {
                // detected encoding is not supported, leave it as it is
            }
        }
        
        return body;
    }
    
    var parse = function (buf) {
        return parseFeed(normalizeEncoding(buf));
    }
    
    return {
        parse: parse
    };
}
