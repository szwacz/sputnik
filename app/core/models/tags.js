var Nedb = require('nedb');
var _ = require('underscore');
var Q = require('q');
var pathUtil = require('path');

export default function () {

    var db;
    var allTags;

    var tagsSort = function () {
        Array.prototype.sort.call(this, function (a, b) {
            return a.name.localeCompare(b.name);
        });
    };

    var init = function (userDataStorageDir) {
        var deferred = Q.defer();

        allTags = [];
        allTags.sort = tagsSort;

        var path;
        if (userDataStorageDir) {
            path = pathUtil.resolve(userDataStorageDir, 'tags.db');
        }

        db = new Nedb({ filename: path, autoload: true });

        db.find({}, function (err, rawTags) {
            rawTags.forEach(function (rawTag) {
                allTags.push(decorateTag(rawTag));
            });
            allTags.sort();
            deferred.resolve();
        });

        return deferred.promise;
    };

    var decorateTag = function (tagData) {
        return {
            get id() { return tagData._id; },
            get name() { return tagData.name; },
            update: function (data) {
                return update(tagData, data);
            },
            remove: function () {
                return remove(this);
            },
        };
    };

    var add = function (data) {
        var deferred = Q.defer();
        db.insert(data, function (err, newTagRawData) {
            if (!err) {
                var tag = decorateTag(newTagRawData);
                allTags.push(tag);
                allTags.sort();
                deferred.resolve();
            }
        });
        return deferred.promise;
    };

    var update = function (tagRawData, newData) {
        var deferred = Q.defer();
        _.extend(tagRawData, newData);
        db.update({ _id: tagRawData._id }, tagRawData, {}, function (err) {
            if (!err) {
                deferred.resolve();
            }
        });
        return deferred.promise;
    };

    var remove = function (tag) {
        var deferred = Q.defer();
        db.remove({ _id: tag.id }, {}, function (err, numRemoved) {
            if (!err) {
                var index = allTags.indexOf(tag);
                allTags.splice(index, 1);
                deferred.resolve();
            }
        });
        return deferred.promise;
    };

    var idsToTags = function (idOrIds) {
        if (Array.isArray(idOrIds)) {
            return idOrIds.map(function (id) {
                return _.findWhere(allTags, { id: id });
            });
        }
        return _.findWhere(allTags, { id: idOrIds });
    };

    return {
        get all() { return allTags; },
        init: init,
        add: add,
        idsToTags: idsToTags,
    };
};
