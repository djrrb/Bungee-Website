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
    var scrollMode = 'vertical', pageWidth, pageHeight;
    var goingToHash = false;
    function doScrollStuff() {
        var scrollTop = win.scrollTop();
        var scrollLeft = article.scrollLeft();
        scrollRatio = scrollMode==='horizontal' ? scrollLeft / pageWidth : scrollTop / pageHeight;
    }

    function watchScroll() {
        $('article').add(window).off('scroll', doScrollStuff).on('scroll', doScrollStuff);
        doScrollStuff();
    }
    
    function unwatchScroll() {
        $('article').add(window).off('scroll', doScrollStuff);
    }
    
    //don't need to call watchScroll here; resize does it on window load
    
    // horizontal scroll to hash
    function goToHash() {
        var pos, bookmark = $(window.location.hash);
        if (bookmark.length) {
            pos = elementOffset(bookmark);
            if (goingToHash || Math.abs(article.scrollLeft()-pos) > win.width()/2) {
                goingToHash = window.location.hash;
                article.stop();
                article.animate({'scrollLeft':pos}, {
                    'duration':'0.5',
                    'complete': function() { goingToHash = false; }
                });
            }
        }
        return false;
    }

    if (window.location.hash) {
        goToHash();
        $(window).on('load', goToHash);
    }
    win.on('hashchange', goToHash);

    var resizing = false;
    function doResizeStuff() {
        resizing = false;
        pageWidth = article.prop('scrollWidth');
        pageHeight = article.prop('scrollHeight');
        scrollMode = pageWidth > pageHeight ? 'horizontal' : 'vertical';
        sectionOffsets = [];
        $('section').each(function() {
            if (this.id) {
                sectionOffsets.push(['#' + this.id, elementOffset(this)]);
            }
        });
        watchScroll();
    }
    
    doResizeStuff();
    $(window).on('load', doResizeStuff);
    
    win.on('resize', function() {
        if (resizing) {
            clearTimeout(resizing);
        } else {
            unwatchScroll();
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
    
    //scrollwheel jacking to turn vertical scroll into horizontal
    $(document).on('wheel', function(evt) {
        if (scrollMode === 'horizontal') {
            var underMouse = $(evt.target).closest('section');
            article.scrollLeft(article.scrollLeft() + evt.originalEvent.deltaX + evt.originalEvent.deltaY);
            if (underMouse.prop('scrollHeight') > win.height()) {
                underMouse.scrollTop(underMouse.scrollTop() + evt.originalEvent.deltaY);
            }
            evt.preventDefault();
        }
    });
});