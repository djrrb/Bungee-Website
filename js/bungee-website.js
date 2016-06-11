$(function() {
    "use strict";

    var win = $(window), page = $('body'), article = $('article');

    //in horizontal mode, the scrolling element is <article> not the window or <html>
    function elementOffset(el) {
        return $(el).offset().left + article.scrollLeft();
    }

    // horizontal scroll to hash
    function goToHash() {
        var pos, bookmark = $(window.location.hash);
        if (bookmark.length) {
            pos = elementOffset(bookmark);
            if (Math.abs(article.scrollLeft()-pos) > win.width()/2) {
                article.animate({'scrollLeft':pos}, {'duration':'0.5'});
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

    // limit jumping around when resizing window
    var scrollRatio=0;
    var sectionOffsets = [];
    function doScrollStuff() {
        var scrollTop = win.scrollTop();
        var scrollLeft = article.scrollLeft();
        var pageWidth = article.prop('scrollWidth');
        var pageHeight = article.prop('scrollHeight');
        scrollRatio = pageWidth > pageHeight ? scrollLeft / pageWidth : scrollTop / pageHeight;
    
        //set URL hash for current section
        for (var i in sectionOffsets) {
            if (sectionOffsets[i][1] > scrollLeft) {
                if (i > 0) {
                    history.replaceState({}, "", sectionOffsets[i-1][0]);
                }
                break;
            }
        }
    }

    function watchScroll() {
        $('article').add(window).on('scroll', doScrollStuff);
    }
    
    function unwatchScroll() {
        $('article').add(window).off('scroll', doScrollStuff);
    }
    
    watchScroll();

    var resizing = false;
    function doResizeStuff() {
        sectionOffsets = [];
        $('section').each(function() {
            sectionOffsets.push(['#' + this.id, elementOffset(this)]);
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