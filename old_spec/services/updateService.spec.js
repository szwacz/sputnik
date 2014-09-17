'use strict';

describe('updateService', function () {
    
    var httpBackend;
    
    beforeEach(module('sputnik', function($provide) {
        $provide.value('config', {
            version: '1.1.1',
            checkUpdatesUrl: 'check/for/updates'
        });
    }));
    beforeEach(inject(function($httpBackend) {
        httpBackend = $httpBackend;
    }));
    
    it("should tell if given version is newer than that in config", inject(function (config, updateService) {
        config.version = '1.1.1';
        expect(updateService.isNewerVersion('1.1.1')).toBe(false);
        expect(updateService.isNewerVersion('0.1.1')).toBe(false);
        expect(updateService.isNewerVersion('1.0.1')).toBe(false);
        expect(updateService.isNewerVersion('1.1.0')).toBe(false);
        expect(updateService.isNewerVersion('2.1.1')).toBe(true);
        expect(updateService.isNewerVersion('1.2.1')).toBe(true);
        expect(updateService.isNewerVersion('1.1.2')).toBe(true);
        expect(updateService.isNewerVersion('10.1.1')).toBe(true);
        expect(updateService.isNewerVersion('1.10.1')).toBe(true);
        expect(updateService.isNewerVersion('1.1.10')).toBe(true);
        config.version = '10.10.10';
        expect(updateService.isNewerVersion('10.10.10')).toBe(false);
        expect(updateService.isNewerVersion('9.11.11')).toBe(false);
        expect(updateService.isNewerVersion('10.9.11')).toBe(false);
        expect(updateService.isNewerVersion('10.10.9')).toBe(false);
        expect(updateService.isNewerVersion('11.10.10')).toBe(true);
        expect(updateService.isNewerVersion('10.11.10')).toBe(true);
        expect(updateService.isNewerVersion('10.10.11')).toBe(true);
    }));
    
    it("should return version number if newer than that in config", inject(function (config, updateService) {
        var done = false;
        httpBackend.whenGET(config.checkUpdatesUrl).respond({ version: '1.1.2' });
        updateService.checkUpdates()
        .then(function (newVersion) {
            expect(newVersion).toBe('1.1.2');
            done = true;
        });
        httpBackend.flush();
        waitsFor(function () { return done; }, null, 500);
    }));
    
    it("should reject if same version as in config", inject(function (config, updateService) {
        var done = false;
        httpBackend.whenGET(config.checkUpdatesUrl).respond({ version: '1.1.1' });
        updateService.checkUpdates()
        .then(null,
        function () {
            done = true;
        });
        httpBackend.flush();
        waitsFor(function () { return done; }, null, 500);
    }));
    
});