/**
 * Restores and saves window state (size, positon etc.).
 */
var windowStateManager = (function () {
    
    var gui = require('nw.gui');
    var win = gui.Window.get();
    var winState;
    var currWinMode;
    var resizeTimeout;
    var isMaximizationEvent = false;
    
    function initWindowState() {
        winState = JSON.parse(localStorage.windowState || 'null');
        
        if (winState) {
            currWinMode = winState.mode;
            if (currWinMode === 'maximized') {
                win.maximize();
            } else {
                // reset to safe defaults when something unusable was saved
                if (winState.x < -10 || winState.x > window.screen.width) {
                    winState.x = 0;
                }
                if (winState.y < -10 || winState.y > window.screen.height) {
                    winState.y = 0;
                }
                
                restoreWindowState();
            }
        } else {
            currWinMode = 'normal';
            
            // if nothing saved yet find best default size
            if (window.screen.width > 1024) {
                win.width = 1180;
                win.x = (window.screen.width - win.width) / 2;
            }
            if (window.screen.height > 768) {
                win.height = window.screen.height - 100;
                win.y = (window.screen.height - win.height) / 2;
            }
            
            dumpWindowState();
        }
        
        $('html').addClass('window-ready');
    }
    
    function dumpWindowState() {
        if (!winState) {
            winState = {};
        }
        
        // we don't want to save minimized state, only maximized or normal
        if (currWinMode === 'maximized') {
            winState.mode = 'maximized';
        } else {
            winState.mode = 'normal';
        }
        
        // when window is maximized you want to preserve normal
        // window dimensions to restore them later (even between sessions)
        if (currWinMode === 'normal') {
            winState.x = win.x;
            winState.y = win.y;
            winState.width = win.width;
            winState.height = win.height;
        }
    }
    
    function restoreWindowState() {
        win.resizeTo(winState.width, winState.height);
        win.moveTo(winState.x, winState.y);
    }
    
    function showWindow() {
        win.show();
    }
    
    function hideWindow() {
        win.hide();
    }
    
    function saveWindowState() {
        dumpWindowState();
        localStorage.windowState = JSON.stringify(winState);
    }
    
    initWindowState();
    
    win.on('maximize', function () {
        isMaximizationEvent = true;
        currWinMode = 'maximized';
    });
    
    win.on('unmaximize', function () {
        currWinMode = 'normal';
        restoreWindowState();
    });
    
    win.on('minimize', function () {
        currWinMode = 'minimized';
    });
    
    win.on('restore', function () {
        currWinMode = 'normal';
    });
    
    win.window.addEventListener('resize', function () {
        // resize event is fired many times on one resize action,
        // this hack with setTiemout forces it to fire only once
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function () {
            
            // on MacOS you can resize maximized window, so it's no longer maximized
            if (isMaximizationEvent) {
                // first resize after maximization event should be ignored
                isMaximizationEvent = false;
            } else {
                if (currWinMode === 'maximized') {
                    currWinMode = 'normal';
                }
            }
            
            dumpWindowState();
            
        }, 500);
    }, false);
    
    return {
        show: showWindow,
        hide: hideWindow,
        save: saveWindowState
    };
    
}());