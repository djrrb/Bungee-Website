$(function() {
    "use strict";
    
    var win = $(window), page = $('body');
    var scrollRatio=0;
    var setScrollRatio = function() {
        var scrollTop = win.scrollTop();
        var scrollLeft = win.scrollLeft();
        scrollRatio = scrollLeft ? scrollLeft / page.width() : scrollTop / page.height();
        console.log(scrollRatio);
    };
    win.on('scroll', setScrollRatio);
    var resizing = false;
    win.on('resize', function() {
        if (resizing) {
            clearTimeout(resizing);
        } else {
            win.off('scroll', setScrollRatio);
        }
        var scrollTop = win.scrollTop();
        var scrollLeft = win.scrollLeft();
        if (scrollLeft) {
            win.scrollLeft(page.width() * scrollRatio);
        } else {
            win.scrollTop(page.height() * scrollRatio);
        }
        resizing = setTimeout(function() {
            win.on('scroll', setScrollRatio);
        }, 1000);
    });
});