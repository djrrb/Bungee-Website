/*
 * SIZE-TO-WIDTH.JS
 *
 * Fits text into a line by adjusting the font-size.
 *
 * Usage: <div class='size-to-width' [data-max-font-size='120px'] [data-max-width='50vw'] [data-max-height='20em']>TEXT</div>
 *
 * Requires jQuery, includes FontFaceObserver: https://github.com/bramstein/fontfaceobserver
 *
 * © 2016 Chris Lewis <chris@chrislewis.codes> All rights reserved. 
 */

(function() {
	"use strict";

	$('head').append('<style> .size-to-width { white-space: nowrap; } </style>');
	
	window.sizeToWidth = function(el) {
		var div;
		if (!el || typeof el === 'number') {
			div = $(this);
		} else {
			div = $(el);
		}
	
		function cssToPx(width) {
			if (typeof width !== 'string') {
				return width;
			}
			if (parseFloat(width) == width) {
				return parseFloat(width);
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
		
		setTimeout(function() { window.sizeToWidth.cssToPx = cssToPx; });

		var maxFontSize = cssToPx(div.data('max-font-size'));
		var maxWidth = cssToPx(div.data('max-width'));
		var maxHeight = cssToPx(div.data('max-height'));
		var fontSize;

		//wrap the text in an inline element to measure text width
		div.wrapInner("<span style='display:inline-block; font-family:inherit; font-stretch: inherit; font-weight:inherit; font-style:inherit; font-size:inherit; text-transform:inherit; letter-spacing: inherit; white-space:nowrap;'></span>");
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
	var stwElements = $();

	function update() {
		stwElements.each(window.sizeToWidth);
	}

	var sizeToWidthTimeout;
	$(window)
	.off('.sizeToWidth')
	.on('load.sizeToWidth', update)
	.on('resize.sizeToWidth', function() {
		sizeToWidthTimeout && clearTimeout(sizeToWidthTimeout);
		sizeToWidthTimeout = setTimeout(update, 100);
	});
	
	window.initSizeToWidth = function(newElements) {
        if (typeof newElements === 'number') {
            newElements = $(this);
        } else if (typeof newElements === 'string' || typeof newElements === 'object') {
            newElements = $(newElements);
        } else if (!newElements || newElements === jQuery) {
        	newElements = $('.size-to-width, .fit-to-width');
        } else {
            return;
        }

		if (!newElements.length) {
    		return;
		}

        stwElements = stwElements.add(newElements);
        
		var fontElements = {};
	
		function updateFontElements(font) {
			$.each(fontElements[font], function(index, el) { 
				//el.css('visibility', 'visible');
				window.sizeToWidth(el); 
			});
		}
	
		newElements.each(function() {
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
					//el.css('visibility', 'hidden');
					var ffo = new FontFaceObserver(family, {
						'weight': weight,
						'style': style,
					});
					ffo.check().then(function() { 
						stwFontsLoaded[key] = true;
						updateFontElements(key);
					}, function() {
    					//failed, so just make it visible
    					//elements.css('visibility','visible');
					});
				}
			}
	
			fontElements[key].push(el);
		});

    	var stwKeyupTimeout;
    	newElements
    	.off('.sizeToWidth')
    	.on('blur.sizeToWidth', update)
    	.on('keyup.sizeToWidth', function() {
    		stwKeyupTimeout && clearTimeout(stwKeyupTimeout);
    		stwKeyupTimeout = setTimeout(update, 1000);
    	});
		
		$(update);
	};

    if (!window.FontFaceObserver) {
//Promise
(function(){'use strict';var f,g=[];function l(a){g.push(a);1==g.length&&f()}function m(){for(;g.length;)g[0](),g.shift()}f=function(){setTimeout(m)};function n(a){this.a=p;this.b=void 0;this.f=[];var b=this;try{a(function(a){q(b,a)},function(a){r(b,a)})}catch(c){r(b,c)}}var p=2;function t(a){return new n(function(b,c){c(a)})}function u(a){return new n(function(b){b(a)})}function q(a,b){if(a.a==p){if(b==a)throw new TypeError;var c=!1;try{var d=b&&b.then;if(null!=b&&"object"==typeof b&&"function"==typeof d){d.call(b,function(b){c||q(a,b);c=!0},function(b){c||r(a,b);c=!0});return}}catch(e){c||r(a,e);return}a.a=0;a.b=b;v(a)}}
function r(a,b){if(a.a==p){if(b==a)throw new TypeError;a.a=1;a.b=b;v(a)}}function v(a){l(function(){if(a.a!=p)for(;a.f.length;){var b=a.f.shift(),c=b[0],d=b[1],e=b[2],b=b[3];try{0==a.a?"function"==typeof c?e(c.call(void 0,a.b)):e(a.b):1==a.a&&("function"==typeof d?e(d.call(void 0,a.b)):b(a.b))}catch(h){b(h)}}})}n.prototype.g=function(a){return this.c(void 0,a)};n.prototype.c=function(a,b){var c=this;return new n(function(d,e){c.f.push([a,b,d,e]);v(c)})};
function w(a){return new n(function(b,c){function d(c){return function(d){h[c]=d;e+=1;e==a.length&&b(h)}}var e=0,h=[];0==a.length&&b(h);for(var k=0;k<a.length;k+=1)u(a[k]).c(d(k),c)})}function x(a){return new n(function(b,c){for(var d=0;d<a.length;d+=1)u(a[d]).c(b,c)})};window.Promise||(window.Promise=n,window.Promise.resolve=u,window.Promise.reject=t,window.Promise.race=x,window.Promise.all=w,window.Promise.prototype.then=n.prototype.c,window.Promise.prototype["catch"]=n.prototype.g);}());

//FontFaceObserver
(function(){var k=!!document.addEventListener;function l(a,b){k?a.addEventListener("scroll",b,!1):a.attachEvent("scroll",b)}function v(a){document.body?a():k?document.addEventListener("DOMContentLoaded",a):document.attachEvent("onreadystatechange",function(){"interactive"!=document.readyState&&"complete"!=document.readyState||a()})};function w(a){this.a=document.createElement("div");this.a.setAttribute("aria-hidden","true");this.a.appendChild(document.createTextNode(a));this.b=document.createElement("span");this.c=document.createElement("span");this.h=document.createElement("span");this.f=document.createElement("span");this.g=-1;this.b.style.cssText="max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";this.c.style.cssText="max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";
this.f.style.cssText="max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";this.h.style.cssText="display:inline-block;width:200%;height:200%;font-size:16px;max-width:none;";this.b.appendChild(this.h);this.c.appendChild(this.f);this.a.appendChild(this.b);this.a.appendChild(this.c)}
function y(a,b){a.a.style.cssText="max-width:none;min-width:20px;min-height:20px;display:inline-block;overflow:hidden;position:absolute;width:auto;margin:0;padding:0;top:-999px;left:-999px;white-space:nowrap;font:"+b+";"}function z(a){var b=a.a.offsetWidth,c=b+100;a.f.style.width=c+"px";a.c.scrollLeft=c;a.b.scrollLeft=a.b.scrollWidth+100;return a.g!==b?(a.g=b,!0):!1}function A(a,b){function c(){var a=m;z(a)&&null!==a.a.parentNode&&b(a.g)}var m=a;l(a.b,c);l(a.c,c);z(a)};function B(a,b){var c=b||{};this.family=a;this.style=c.style||"normal";this.weight=c.weight||"normal";this.stretch=c.stretch||"normal"}var C=null,D=null,H=!!window.FontFace;function I(){if(null===D){var a=document.createElement("div");try{a.style.font="condensed 100px sans-serif"}catch(b){}D=""!==a.style.font}return D}function J(a,b){return[a.style,a.weight,I()?a.stretch:"","100px",b].join(" ")}
B.prototype.load=function(a,b){var c=this,m=a||"BESbswy",x=b||3E3,E=(new Date).getTime();return new Promise(function(a,b){if(H){var K=new Promise(function(a,b){function e(){(new Date).getTime()-E>=x?b():document.fonts.load(J(c,c.family),m).then(function(c){1<=c.length?a():setTimeout(e,25)},function(){b()})}e()}),L=new Promise(function(a,c){setTimeout(c,x)});Promise.race([L,K]).then(function(){a(c)},function(){b(c)})}else v(function(){function q(){var b;if(b=-1!=f&&-1!=g||-1!=f&&-1!=h||-1!=g&&-1!=
h)(b=f!=g&&f!=h&&g!=h)||(null===C&&(b=/AppleWebKit\/([0-9]+)(?:\.([0-9]+))/.exec(window.navigator.userAgent),C=!!b&&(536>parseInt(b[1],10)||536===parseInt(b[1],10)&&11>=parseInt(b[2],10))),b=C&&(f==r&&g==r&&h==r||f==t&&g==t&&h==t||f==u&&g==u&&h==u)),b=!b;b&&(null!==d.parentNode&&d.parentNode.removeChild(d),clearTimeout(G),a(c))}function F(){if((new Date).getTime()-E>=x)null!==d.parentNode&&d.parentNode.removeChild(d),b(c);else{var a=document.hidden;if(!0===a||void 0===a)f=e.a.offsetWidth,g=n.a.offsetWidth,
h=p.a.offsetWidth,q();G=setTimeout(F,50)}}var e=new w(m),n=new w(m),p=new w(m),f=-1,g=-1,h=-1,r=-1,t=-1,u=-1,d=document.createElement("div"),G=0;d.dir="ltr";y(e,J(c,"sans-serif"));y(n,J(c,"serif"));y(p,J(c,"monospace"));d.appendChild(e.a);d.appendChild(n.a);d.appendChild(p.a);document.body.appendChild(d);r=e.a.offsetWidth;t=n.a.offsetWidth;u=p.a.offsetWidth;F();A(e,function(a){f=a;q()});y(e,J(c,'"'+c.family+'",sans-serif'));A(n,function(a){g=a;q()});y(n,J(c,'"'+c.family+'",serif'));A(p,function(a){h=
a;q()});y(p,J(c,'"'+c.family+'",monospace'))})})};window.FontFaceObserver=B;window.FontFaceObserver.prototype.check=window.FontFaceObserver.prototype.load=B.prototype.load;"undefined"!==typeof module&&(module.exports=window.FontFaceObserver);}());
    }

	$(initSizeToWidth);
})();
