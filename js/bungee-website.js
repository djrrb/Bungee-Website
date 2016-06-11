$(function() {
    "use strict";

    var win = $(window), page = $('body'), article = $('article');

    //in horizontal mode, the scrolling element is <article> not the window or <html>
    function elementOffset(el) {
        return $(el).offset().left + article.scrollLeft();
    }

    // limit jumping around when resizing window
    var scrollRatio=0;
    var sectionOffsets = [];
    var ignoreScroll = false;
    function doScrollStuff() {
        if (ignoreScroll) return;
        var scrollTop = win.scrollTop();
        var scrollLeft = article.scrollLeft();
        var pageWidth = article.prop('scrollWidth');
        var pageHeight = article.prop('scrollHeight');
        scrollRatio = pageWidth > pageHeight ? scrollLeft / pageWidth : scrollTop / pageHeight;
    
        //set URL hash for current section
        for (var i in sectionOffsets) {
            if (sectionOffsets[i][1] > scrollLeft+win.width()*0.1) {
                if (i > 0 && window.location.hash !== sectionOffsets[i-1][0]) {
                    history.replaceState({}, "", sectionOffsets[i-1][0]);
                }
                break;
            }
        }
    }

    function watchScroll() {
        $('article').add(window).on('scroll', doScrollStuff);
        doScrollStuff();
    }
    
    function unwatchScroll() {
        $('article').add(window).off('scroll', doScrollStuff);
    }
    
    //don't need to call watchScroll here; resize does it on window load
    
    // horizontal scroll to hash
    function goToHash(hash) {
        var pos, bookmark = $(typeof hash==="string" ? hash : window.location.hash);
        if (bookmark.length) {
            pos = elementOffset(bookmark);
            if (Math.abs(article.scrollLeft()-pos) > win.width()/2) {
                ignoreScroll = true;
                article.animate({'scrollLeft':pos}, {
                    'duration':'0.5',
                    'complete': function() { ignoreScroll = false; }
                });
            }
        }
        return false;
    }

    if (window.location.hash) {
        $(window).on('load', goToHash);
    }
    win.on('hashchange', goToHash);

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
    function doResizeStuff() {
        resizing = false;
        sectionOffsets = [];
        $('section').each(function() {
            if (this.id) {
                sectionOffsets.push(['#' + this.id, elementOffset(this)]);
            }
        });
        watchScroll();
//        calculateColumns();
    }
    
    $(window).on('load', doResizeStuff);
    
    win.on('resize', function() {
        if (resizing) {
            clearTimeout(resizing);
        } else {
            unwatchScroll();
//            resetColumns();
        }
        var scrollTop = win.scrollTop();
        var scrollLeft = article.scrollLeft();
        if (scrollLeft) {
            article.scrollLeft(article.prop('scrollWidth') * scrollRatio);
        } else {
            win.scrollTop(page.height() * scrollRatio);
        }
        resizing = setTimeout(doResizeStuff, 1000);
    });
});