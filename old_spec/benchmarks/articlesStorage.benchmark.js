'use strict'

var articlesStorage = require('../../app/models/articlesStorage');
var fs = require('fs');
var Q = require('q');

var workingDir = '../temp';
var dbPath = workingDir + '/articles.nedb';

if (!fs.existsSync(workingDir)) {
    fs.mkdirSync(workingDir);
}
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
}

var as;

var feeds = [];
var currDate = 0;
var currMonth = 0;
var totalArticles = 0;
var start;
var tag;

function randomString(length) {
    var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}

function startTime() {
    start = Date.now();
}

function stopTime() {
    var stop = Date.now();
    var time = stop - start;
    console.log(' ' + time + 'ms');
}

function dbSize() {
    var size = fs.statSync(dbPath).size;
    var mb = Math.round(size / 1000000);
    console.log('database size: ' + mb +'MB');
}

var articleTitle = randomString(32);
var articleContent = randomString(6000); // average article size is about 6KB

function generateArticles(numMonths) {
    var numDays = numMonths * 30;
    var  arts = [];
    for (var i = 0; i < numDays; i += 1) {
        for (var j = 0; j < articlesPerFeedPerDay; j += 1) {
            currDate += 1;
            totalArticles += 1;
            arts.push({
                title: articleTitle,
                description: articleContent,
                link: 'http://something.com/' + currDate,
                pubDate: new Date(currDate),
            });
        };
    };
    return arts;
}

function digestOneMonth() {
    var deferred = Q.defer();
    var feedIndex = 0;
    
    function digestFeed() {
        var feedId = feeds[feedIndex];
        if (!feedId) {
            deferred.resolve();
        } else {
            as.digest(feedId, generateArticles(1))
            .then(function () {
                feedIndex += 1;
                digestFeed();
            });
        }
    }
    digestFeed();
    
    return deferred.promise;
}

function monthTest() {
    var deferred = Q.defer();
    
    // symulating turning app off and on again to perform database compact
    as = articlesStorage.make(dbPath);
    
    process.stdout.write('digest...');
    startTime();
    digestOneMonth()
    .then(function () {
        stopTime();
        process.stdout.write('get 50 newest articles...');
        startTime();
        return as.getArticles(feeds, 0, 50);
    })
    .then(function () {
        stopTime();
        process.stdout.write('tag article...');
        startTime();
        return as.tagArticle('http://something.com/' + currDate, tag.id);
    })
    .then(function () {
        stopTime();
        process.stdout.write('get tagged articles...');
        startTime();
        return as.getArticles(feeds, 0, 50, { tagId: tag.id });
    })
    .then(function () {
        stopTime();
        process.stdout.write('count unread...');
        startTime();
        return as.countUnread(feeds[0]);
    })
    .then(function () {
        stopTime();
        process.stdout.write('mark one of articles as read...');
        startTime();
        return as.setArticleReadState('http://something.com/' + currDate, true);
    })
    .then(function () {
        stopTime();
        process.stdout.write('mark all articles as read...');
        startTime();
        return as.markAllAsRead(feeds);
    })
    .then(function () {
        stopTime();
        console.log('stored articles: ' + totalArticles);
        dbSize();
        deferred.resolve();
    });
    
    return deferred.promise;
}

function runTest() {
    currMonth += 1;
    console.log('------------------------------------');
    console.log('MONTH: ' + currMonth);
    monthTest()
    .then(function () {
        if (currMonth < numMonths) {
            runTest();
        }
    });
}

//---------------------------------------------------------
// Test
//---------------------------------------------------------

// 50 new articles per day times 12 monts
var numFeeds = 25;
var articlesPerFeedPerDay = 2;
var numMonths = 12;

console.log('articlesStorage performance benchmark (simulating hardcore usage through months)');
console.log('feeds: ' + numFeeds);
console.log('articles per day: ' + articlesPerFeedPerDay);
console.log('through months: ' + numMonths);

// create feeds
for (var i = 0; i < numFeeds; i += 1) {
    var url = 'http://some.example.site.com/feed' + feeds.length;
    feeds.push(url);
};

as = articlesStorage.make(dbPath);

// one tag needed for test
as.addTag('Test tag')
.then(function (addedTag) {
    tag = addedTag;
    runTest();
});