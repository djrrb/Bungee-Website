function specimensize() {
	$('.fit-to-width').each(function() {
		var div = $(this);
		

		//wrap the text in an inline element to measure text width
		div.contents().wrap("<span style='display:inline; font-family:inherit; font-weight:inherit; font-style:inherit; font-size:inherit; text-transform:inherit; white-space:nowrap;'></span>");
		var span = div.children('span');

		var fullwidth = div.width();
		var maxFontSize = div.data('max-font-size');
		var fontSize;

		//measure twice in case rounding errors get in the way		
		for (var i = 0; i < 2; i++) {
			textwidth = span.width();
			if (textwidth && textwidth != fullwidth) {
    			fontSize = Math.floor(parseInt(div.css('font-size')) * fullwidth / textwidth);
    			if (maxFontSize > 0) {
        			fontSize = Math.min(fontSize, maxFontSize);
    			}
				div.css('font-size', fontSize + 'px');
			}
		}

		//get rid of the temporary span	
		span.contents().unwrap();
	});
}

$(document).on('ready', specimensize);
$(window).on('load resize', specimensize);