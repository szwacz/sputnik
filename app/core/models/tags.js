// Manages tags for articles.

var Nedb = require('nedb');
var _ = require('underscore');
var Q = require('q');

export default function () {
    
    var db;
    
    var init = function (path) {
        db = new Nedb({ filename: path, autoload: true });
    };
    
    var add = function (name) {
        var deferred = Q.defer();
        db.insert({ name: name }, function (err, newTag) {
            deferred.resolve(newTag);
        });
        return deferred.promise;
    };
    
    var update = function (id, data) {
        var deferred = Q.defer();
        db.update({ _id: id }, data, function (err, numReplaced) {
            db.findOne({ _id: id }, function (err, updatedTag) {
                deferred.resolve(updatedTag);
            });
        });
        return deferred.promise;
    };
    
    // Give here array of ids, and you will be given back the array of full tag objects.
    var idsToObjects = function (ids) {
        var deferred = Q.defer();
        db.find({ _id: { $in: ids } }, function (err, tags) {
            var tagsInAskedOrder = ids.map(function (id) {
                return _.findWhere(tags, { _id: id });
            });
            deferred.resolve(tagsInAskedOrder);
        });
        return deferred.promise;
    };
    
    return {
        init: init,
        add: add,
        update: update,
        idsToObjects: idsToObjects,
    };
};