'use strict';

function monthLabel(month) {
    var labels = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ];
    return labels[month];
}

exports.organizeByDays = function (articles) {
    var now = new Date();
    var yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    
    function getDayName(date) {
        if (now.getDate() === date.getDate() &&
            now.getMonth() === date.getMonth() &&
            now.getFullYear() === date.getFullYear()) {
            return 'Today';
        }
        if (yesterday.getDate() === date.getDate() &&
            yesterday.getMonth() === date.getMonth() &&
            yesterday.getFullYear() === date.getFullYear()) {
            return 'Yesterday';
        }
        if (date.getTime() > now.getTime() - (8 * 30 * 24 * 60 * 60 * 1000)) {
            // if less that 8 months ago don't show year
            return date.getDate() + ' ' + monthLabel(date.getMonth());
        }
        return date.getDate() + ' ' + monthLabel(date.getMonth()) + ' ' + date.getFullYear();
    }
    
    function isSameDay(date1, date2) {
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        );
    }
    
    articles.sort(function (art1, art2) {
        return art2.pubDate - art1.pubDate;
    });
    
    var articlesDays = [];
    var currDate = new Date(0); // 1970
    
    for (var i = 0; i < articles.length; i += 1) {
        var art = articles[i];
        if (!isSameDay(currDate, art.pubDate)) {
            art.dayLabel = getDayName(art.pubDate);
        }
        currDate = art.pubDate;
        articlesDays.push(art);
    }
    
    return articlesDays;
}