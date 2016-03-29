$(function() {
    "use strict";

    var win = $(window), page = $('body'), article = $('article');

    // horizontal scroll to hash
    function goToHash() {
        var pos, bookmark = $(window.location.hash);
        if (bookmark.length) {
            pos = bookmark.offset().left + article.scrollLeft();
            if (pos > win.width()/2) {
                article.animate({'scrollLeft':pos}, {'duration':'0.5'});
            }
        }
        return false;
    }

    window.location.hash && goToHash();
    win.on('hashchange', goToHash);

    // limit jumping around when resizing window
    var scrollRatio=0;
    function setScrollRatio() {
        var scrollTop = win.scrollTop();
        var scrollLeft = win.scrollLeft();
        scrollRatio = scrollLeft ? scrollLeft / page.width() : scrollTop / page.height();
    }
    
    win.on('scroll', setScrollRatio);

    // do horizontal column wrapping if content overflows
/*
    function resetColumns() {
        $('section').css({'column-count': '', 'width': ''});
    }

    function calculateColumns() {
        $('section').each(function() {
            var section = $(this);
            var contentHeight = section.height();
            var windowHeight = page.height();
            var columns = Math.ceil(contentHeight / windowHeight);
            if (columns > 1) {
            console.log(this.id, columns, section.width());
                var gap = parseFloat(section.css('column-gap'));
                section.width(section.width()*columns + gap*(columns-1));
                section.css('column-count', columns);
            }
        });
    }

    calculateColumns();
*/

    var resizing = false;
    win.on('resize', function() {
        if (resizing) {
            clearTimeout(resizing);
        } else {
            win.off('scroll', setScrollRatio);
//            resetColumns();
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
//            calculateColumns();
        }, 1000);
    });
});