export default function ($scope, config, feedsService, articlesService, faviconsService) {
    
    $scope.allTags = [];
    
    $scope.lastSignificantEvent = 'appJustStarted';
    
    $(document.body).removeClass('app-not-ready');
    
    //-----------------------------------------------------
    // Notification bar
    //-----------------------------------------------------
    
    var notificationInterval;
    $scope.notificationBarVisible = false;
    $scope.notificationMessage = null;
    
    $scope.$on('showNotification', function (evt, message) {
        $scope.notificationMessage = message;
        $scope.notificationBarVisible = true;
        $scope.$apply();
        
        // calculate position for notification bar
        var xAxis = $('.column-one').width() + $('.column-two').width() / 2;
        var notifBar = $('.notification-bar');
        var left = xAxis - notifBar.width() / 2 - 32;
        notifBar.css('left', left);
        
        var duration = Math.max(4000, message.length * 120);
        clearInterval(notificationInterval);
        notificationInterval = setInterval(function () {
            $scope.notificationBarVisible = false;
            $scope.$apply();
        }, duration);
    });
    
    //-----------------------------------------------------
    // Model events
    //-----------------------------------------------------
    
    $scope.$on('feedAdded', function (evt, feed) {
        $scope.lastSignificantEvent = 'feedAdded';
    });
    
    $scope.$on('feedSiteUrlSpecified', function (evt, feed) {
        // is siteUrl first time specified try to get its favicon
        faviconsService.updateOne(feed);
    });
    
    $scope.$on('feedRemoved', function (evt, feed) {
        faviconsService.deleteFaviconIfHas(feed);
        // Articles for now are not deleted (seems more user friendly approach)
    });
    
    $scope.$on('feedsImported', function (evt) {
        faviconsService.updateMany(feedsService.feeds);
        $scope.lastSignificantEvent = 'feedsImported';
    });
    
    $scope.$on('tagsListChanged', function (evt) {
        $scope.allTags = articlesService.allTags;
    });
    
    $scope.$on('faviconUpdated', function (evt) {
        $scope.$apply();
    });
    
}