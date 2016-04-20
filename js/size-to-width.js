/*
 * SIZE-TO-WIDTH.JS
 *
 * Fits text into a line by adjusting the font-size.
 *
 * Usage: <div class='size-to-width' [data-max-font-size='120px'] [data-max-width='50vw'] [data-max-height='20em']>TEXT</div>
 *
 * Requires jQuery and FontFaceObserver: https://github.com/bramstein/fontfaceobserver
 *
 * © 2016 Chris Lewis <chris@chrislewis.codes> All rights reserved. 
 */

(function() {
	"use strict";

	$('head').append('<style> .size-to-width { white-space: nowrap; } </style>');
	
	window.FontFaceObserver || $('head').append("<script src='http://chrislewis.codes/js/fontfaceobserver.js'></script>");
	
	window.sizeToWidth = function(el) {
		var div;
		if (!el || typeof el === 'number') {
			div = $(this);
		} else {
			div = $(el);
		}
	
		function cssToPx(width) {
			if (parseFloat(width) == width) {
				return parseFloat(width);
			}
			if (typeof width !== 'string') {
				return width;
			}
			var test = div.clone();
			test.attr('id', '');
			test.css({
				'position': 'absolute',
				'visibility': 'hidden',
				'box-sizing': 'content-box',
				'font-size': '',
				'width': width
			});
			test.appendTo(div.parent());
			var result = test.width();
			test.remove();
			return result;
		}

		var maxFontSize = cssToPx(div.data('max-font-size'));
		var maxWidth = cssToPx(div.data('max-width'));
		var maxHeight = cssToPx(div.data('max-height'));
		var fontSize;

		//wrap the text in an inline element to measure text width
		div.wrapInner("<span style='display:inline-block; font-family:inherit; font-weight:inherit; font-style:inherit; font-size:inherit; text-transform:inherit; white-space:nowrap;'></span>");
		var span = div.children('span');
	
		var fullwidth = div.width();
		var textwidth;
	
		textwidth = span.width();
		if (textwidth && Math.abs(fullwidth-textwidth)/fullwidth > 0.01) {
			fontSize = Math.floor(parseInt(div.css('font-size')) * fullwidth / textwidth);
			if (maxFontSize) {
				fontSize = Math.min(fontSize, maxFontSize);
			}
			div.css('font-size', fontSize + 'px');
			if (maxWidth && maxWidth < div.width()) {
				fontSize *= maxWidth / div.width();
				div.css('font-size', fontSize + 'px');
			}
			if (maxHeight && maxHeight < div.height()) {
				fontSize *= maxHeight / div.height();
				div.css('font-size', fontSize + 'px');
			}
		}
	
		//get rid of the temporary span	
		span.contents().unwrap();
	};
	
	var stwFontsLoaded = {};
	function initSizeToWidth() {
		var elements = $('.size-to-width');
		var fontElements = {};
	
		function updateFontElements(font) {
			$.each(fontElements[font], function(index, el) { 
				el.css('visibility', 'visible');
				window.sizeToWidth(el); 
			});
		}
	
		function update() {
			elements.each(window.sizeToWidth);
		}
	
		elements.each(function() {
			var el = $(this);
			var family = el.css('font-family').replace(/,.*/, ''); //remove fallbacks
			var style = el.css('font-style');
			var weight = el.css('font-weight');
			var key = family + ';;;' + style + ';;;' + weight;
			
			if (!(key in fontElements)) {
				fontElements[key] = [];
				if (key in stwFontsLoaded) {
					window.sizeToWidth(el);
				} else {
					el.css('visibility', 'hidden');
					var ffo = new FontFaceObserver(family, {
						'weight': weight,
						'style': style,
					});
					ffo.check().then(function() { 
						stwFontsLoaded[key] = true;
						updateFontElements(key);
					});
				}
			}
	
			fontElements[key].push(el);
		});
		
		var sizeToWidthTimeout;
		$(window)
		.off('.sizeToWidth')
		.on('load.sizeToWidth', update)
		.on('resize.sizeToWidth', function() {
			sizeToWidthTimeout && clearTimeout(sizeToWidthTimeout);
			sizeToWidthTimeout = setTimeout(update, 100);
		});
		
		var stwKeyupTimeout;
		elements
		.off('.sizeToWidth')
		.on('blur.sizeToWidth', update)
		.on('keyup.sizeToWidth', function() {
			stwKeyupTimeout && clearTimeout(stwKeyupTimeout);
			stwKeyupTimeout = setTimeout(update, 1000);
		});
		
		$(update);
	}
	
	$(function() {
		//if we had to add a <script> tag for FontFaceObserver, it might not be available immediagely
		var waitForFFO;
		waitForFFO = setInterval(function() {
			if (window.FontFaceObserver) {
				initSizeToWidth();
				clearInterval(waitForFFO);
			}
		}, 100);
	});
})();
