import opml from '../helpers/opml';

var fs = require('fs');

export default function ImportExportCtrl($scope, $location, feedsService) {
    
    $scope.state = 'waitingForUser';
    
    $scope.exportVisible = (feedsService.feeds.length > 0);
    
    $scope.openImportDialog = function () {
        angular.element('#selectedOpmlPath').trigger('click');
    };
    
    angular.element('#selectedOpmlPath').change(function () {
        var filePath = this.value;
        $scope.$apply(function () {
            var opmlFileContent = fs.readFileSync(filePath, { encoding : 'utf8' });
            if (feedsService.isValidOpml(opmlFileContent)) {
                feedsService.importOpml(opmlFileContent);
                $location.path('/');
            } else {
                $scope.state = 'importFileInvalid';
            }
        });
    });
    
    $scope.openExportDialog = function () {
        angular.element('#saveOpmlToPath').trigger('click');
    };
    
    angular.element('#saveOpmlToPath').change(function () {
        var filePath = this.value;
        var opmlData = feedsService.exportOpml();
        fs.writeFileSync(filePath, opmlData);
        $scope.state = 'exportDone';
        $scope.$apply();
    });
    
}