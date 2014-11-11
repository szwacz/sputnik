import tagsModel from './tags';

describe('tags model', function () {
    
    var tags;
    
    beforeEach(module('sputnik', function($provide) {
        $provide.service('tags', tagsModel);
    }));
    
    beforeEach(inject(function (_tags_) {
        tags = _tags_;
    }));
    
    it('can add a tag', function (done) {
        tags.init();
        tags.add('tag name')
        .then(function (createdTag) {
            expect(createdTag._id).toBeDefined();
            expect(createdTag.name).toBe('tag name');
            done();
        });
    });
    
    it('can update a tag', function (done) {
        tags.init();
        tags.add('tag name')
        .then(function (createdTag) {
            return tags.update(createdTag._id, { name: 'different name' });
        })
        .then(function (updatedTag) {
            expect(updatedTag._id).toBeDefined();
            expect(updatedTag.name).toBe('different name');
            done();
        });
    });
    
    it('can delete a tag', function (done) {
        var id;
        tags.init();
        tags.add('tag name')
        .then(function (createdTag) {
            id = createdTag._id;
            return tags.delete(id);
        })
        .then(function (createdTag) {
            return tags.idsToObjects([id]);
        })
        .then(function (tags) {
            expect(tags).toEqual([undefined]);
            done();
        });
    });
    
    it('can replace tags Ids with its full objects', function (done) {
        var createdTags = [];
        tags.init();
        tags.add('tag1')
        .then(function (createdTag) {
            createdTags.push(createdTag);
            return tags.add('tag2');
        })
        .then(function (createdTag) {
            createdTags.push(createdTag);
            return tags.add('tag3');
        })
        .then(function (createdTag) {
            createdTags.push(createdTag);
            return tags.idsToObjects([createdTags[0]._id, createdTags[1]._id, createdTags[2]._id]);
        })
        .then(function (yourTags) {
            expect(createdTags).toEqual(yourTags);
            done();
        });
    });
    
});