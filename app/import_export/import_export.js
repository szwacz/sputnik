import importExportCtrl from './controllers/import_export_ctrl';
import opml from './services/opml';

var definition = {
    name: 'importExport',
    view: {
        controller: 'ImportExportCtrl',
        templateUrl: 'import_export/views/import_export.html'
    }
};

export default definition;

angular.module(definition.name, [])
.controller('ImportExportCtrl', importExportCtrl)
.service('opml', opml);