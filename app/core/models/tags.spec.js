import tagsModel from './tags';

var jetpack = require('fs-jetpack');
var os = require('os');

describe('tags model', function () {

    var tmpdir = os.tmpdir() + '/sputnik_unit_tests';
    var tags;

    beforeEach(module('sputnik', function($provide) {
        $provide.service('tags', tagsModel);
    }));

    beforeEach(inject(function (_tags_) {
        tags = _tags_;
    }));

    afterEach(function() {
        jetpack.dir(tmpdir, { exists: false });
    });

    var reload = function () {
        return tags.init(tmpdir);
    };

    it('can add, update, remove tag', function (done) {
        reload()
        .then(function () {
            return tags.add({
                name: 'tag name'
            });
        })
        .then(reload)
        .then(function () {
            expect(tags.all.length).toBe(1);
            var t = tags.all[0];
            expect(t.id).toBeDefined();
            expect(t.name).toBe('tag name');
            return t.update({
                name: 'bazinga!'
            });
        })
        .then(reload)
        .then(function () {
            expect(tags.all.length).toBe(1);
            var t = tags.all[0];
            expect(t.name).toBe('bazinga!');
            return t.remove();
        })
        .then(reload)
        .then(function () {
            expect(tags.all.length).toBe(0);
            done();
        })
    });

    it('can return tag objects from given id or ids', function (done) {
        reload()
        .then(function () {
            return tags.add({
                name: 'T1'
            });
        })
        .then(function () {
            return tags.add({
                name: 'T2'
            });
        })
        .then(function () {
            // When solo id given returns one object
            var t = tags.idsToTags(tags.all[0].id);
            expect(t).toBe(tags.all[0]);
            // When array of ids given returns array of objects
            var arr = tags.idsToTags([tags.all[0].id, tags.all[1].id]);
            expect(arr[0]).toBe(tags.all[0]);
            expect(arr[1]).toBe(tags.all[1]);
            done();
        });
    });

    it('sorts tags in alphabetical order', function (done) {
        reload()
        .then(function () {
            return tags.add({
                name: 'T2'
            });
        })
        .then(function () {
            return tags.add({
                name: 'T1'
            });
        })
        .then(function () {
            return tags.add({
                name: 'T3'
            });
        })
        .then(function () {
            expect(tags.all[0].name).toBe('T1');
            expect(tags.all[1].name).toBe('T2');
            expect(tags.all[2].name).toBe('T3');
        })
        .then(reload)
        .then(function () {
            expect(tags.all[0].name).toBe('T1');
            expect(tags.all[1].name).toBe('T2');
            expect(tags.all[2].name).toBe('T3');
            done();
        });
    });

});
