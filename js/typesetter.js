
(function() {
    "use strict";

    var win = $(window);

    //populate presets from colors file
    $.ajax('data/bungee-colors.json', {
        'success': function(data) {
            $(function() {
                window.Bungee.presets = {};
                var preset, classes;
                for (var i in data) {
                    preset = data[i];
                    classes = ['bungee', 'block-circle', 'palette', preset.name];
                    window.Bungee.presets[preset.name] = preset;
                    $.each(preset, function(layer, color) {
                        var classname;
                        if (!color || !color.hex) {
                            return;
                        }
                        if (color.active === false && layer !== 'sign') {
                            return;
                        }
                        classname = layer + '-' + color.hex;
                        if (color.alpha) {
                            classname += '-' + (color.alpha*100);
                        }
                        classes.push(classname);
                    });
                    $('#palettes').append("<li><input type='radio' name='preset' id='preset-" + preset.name + "' value='" + preset.name + "'><label for='preset-" + preset.name + "' class='" + classes.join(' ') + "'>R</label></li>")
                }
                $('#palettes .bungee').each(window.Bungee.init);
            });
        }
    });

    win.on('load', function() {
        var Bungee = window.Bungee;
        var preview = $('#preview').addClass('bungee');
        var allcontrols = $('#controls input, #controls select');
        var presetcontrols = $('#palettes input');
        var layercontrols = $('#layer-controls .swatch');
        var orientationcontrols = $('#controls input[name=orientation]');
        //var rotatedcontrol = $('#controls input[name=rotated]');
        var altcontrols = $('#controls input[name=alt]');
        //var autofit = $('#controls input[name=autofit]');
        var textcontrol = $('#controls input[name=text]');
        var backgroundcontrols = $('#background-controls input');
        
        var previewPreInit;
        
        function getCode() {
            var tab = "  ";
            var code = "";
            
            code += '<!-- put this stuff inside <head> -->\n';
            code += tab + '<!-- copy these files from resources/web folder -->\n';
            code += tab + '<link rel="stylesheet" href="bungee.css">\n';
            code += tab + '<script src="bungee.js"></script>\n';
            code += '<!-- end of </head> content -->\n\n';

            var el = previewPreInit[0];
            el.removeAttribute('id');
            el.removeAttribute('data-max-font-size');
            
            code += el.outerHTML + "\n\n";
            
            code = code.replace(/[<>&]/g, function(c) { 
                switch(c) {
                    case '<': return '&lt;';
                    case '>': return '&gt;';
                    case '&': return '&amp;';
                    default: return "&#" + c.charCodeAt(0) + ";";
                }
            });
            
            return code;
        }
    
        function colorToLayerClass(color) {
            var layerclass = color.toHex();
            if (color.getAlpha() < 1) {
                layerclass += '-' + (color.getAlpha()*100);
            }
            return layerclass;
        }
    
        function setURL() {
            var url = $('#controls').serialize(); // + '&text=' + encodeURIComponent(preview.find('span').first().text().trim());
            $('#permalink').prop('href', '?' + url + '#' + preview.closest('section').prop('id'));
        }
        
        function doSVG() {
            var reference = preview.find('.layer.text');
            var req = {};
            req.text = Bungee.cleanupText(textcontrol.val()); //reference.find('span').first().text().trim();
            req.size = 144;
            req.orientation = orientationcontrols.filter(':checked').val();
            req.layers = {};
            layercontrols.filter(':checked').each(function() {
                var color = reference.filter('.' + this.value).css('color');
                if (/(\d+),\s*(\d+),\s*(\d+)/.test(color)) {
                    var red = RegExp.$1;
                    var green = RegExp.$2;
                    var blue = RegExp.$3;
                    red = Number(red).toString(16);
                    green = Number(green).toString(16);
                    blue = Number(blue).toString(16);
                    if (red.length===1) { red = '0' + red; }
                    if (green.length===1) { green = '0' + green; }
                    if (blue.length===1) { blue = '0' + blue; }
                    color = red + green + blue;
                }
                req.layers[this.value] = color;
            });
            backgroundcontrols.filter(':checked').each(function() {
                req[this.name] = Bungee[this.name + 'Chars'][this.value];
            })
            req.ss = [];
            altcontrols.filter(':checked').each(function() {
                req.ss.push(Bungee.stylisticAlternates[this.value]);
            });
            req.ss = req.ss.join(',');
            
            $('#svg').html('<img src="/svg.php?' + $.param(req) + '" alt="SVG rendition">');

            req.format = 'png';
            var png = $('<img src="/svg.php?' + $.param(req) + '" alt="PNG rendition">');

            png.on('load', function() {
                var img = $(this);
                img.css({
                    'width': (img.width()/2) + 'px',
                    'height': (img.height()/2) + 'px'
                });
            });

            $('#png').html(png);
            
            req.format='pdf';
            $('#pdf').attr('href', '/svg.php?' + $.param(req));
        }

        function updatePreview(evt) {
            var actor, temp;

            if (evt && evt !== jQuery) {
                //evt will either be a real event, or an element
                actor = evt.target || evt;
            } else {
                actor = textcontrol.get(0);
            }

            if (actor.tagName === 'LABEL') {
                // this will be called again for the actual input element
                return;
            }
                        
            var classes = [];
            $.each(preview.prop('className').split(/\s+/), function(i, cls) {
                if (!/^(?:block|banner|sign|begin|end|block|alt|horizontal|vertical|regular|inline|outline|shade|background)(?:-.+)?$/.test(cls)) {
                    classes.push(cls);
                }
            });

            var text = Bungee.cleanupText(textcontrol.val());
            
            var preset = Bungee.presets[presetcontrols.filter(':checked').val()] || {};

            var layers = [];
            if (presetcontrols.is(actor)) {
                //reset layer checkboxes on preset change
                $.each(preset, function(layer, color) {
                    var on = color.active !== false || layer === 'sign';
                    var layercontrol = layercontrols.filter('.' + layer);
                    if (!layercontrol.length || !color.hex) {
                        return;
                    }
                    var newcolor = tinycolor(color.hex);
                    if (color.alpha) {
                        newcolor.setAlpha(color.alpha);
                    }
                    layercontrol.spectrum('set', newcolor);
                    handleColor(layercontrol, on && newcolor, true);
                    var layerclass = colorToLayerClass(newcolor);
                    if (on) {
                        layers.push(layer + '-' + layerclass);
                    }
                });
            } else {
                //otherwise read layers from checkboxes
                layercontrols.filter(':not(.none)').each(function() {
                    var layer = $(this);
                    layers.push(layer.data('layer') + '-' + colorToLayerClass(layer.spectrum('get')));
                });
                if (layercontrols.filter('.background.none').length) {
                    layers.push('background-transparent');
                }
            }

            //no layers == all layers
            if (layers.length === 0) {
                layers = ["inline", "outline", "regular", "shade"];
            }
            
            for (var i in layers) {
                classes.push(layers[i]);
            }

            var orientation = orientationcontrols.filter(':checked').val();
            classes.push(orientation);
            $('.preview').removeClass('horizontal vertical').addClass(orientation);

            //rotated mode
            //$('html')[rotatedcontrol.prop('checked') ? 'addClass' : 'removeClass']('no-vertical-text');
            
            //backgrounds
            if (backgroundcontrols.is(actor)) {
                if (actor.name === 'block' || actor.value === "") {
                    $('#begin-').prop('checked', true);
                    $('#end-').prop('checked', true);
                } else {
                    $('#block-').prop('checked', true);
                    if (actor.name === 'begin' && $('#end-').prop('checked')) {
                        $('#end-' + actor.value).prop('checked', true);
                    } else if (actor.name === 'end' && $('#begin-').prop('checked')) {
                        $('#begin-' + actor.value).prop('checked', true);
                    }
                }
            }

            var begin=backgroundcontrols.filter('[name=begin]:checked').val(),
                end=backgroundcontrols.filter('[name=end]:checked').val(),
                block=backgroundcontrols.filter('[name=block]:checked').val();

            if (begin && end) {
                classes.push('begin-' + begin);
                classes.push('end-' + end);
            } else if (block) {
                classes.push('block-' + block);
            }
            
            //alts
            altcontrols.filter(':checked').each(function() {
                classes.push('alt-' + this.value);
            });

            //update the preview!
            preview.prop('className', classes.join(' ')).text(text);
            
            previewPreInit = preview.clone();
            
            Bungee.init(preview);
            
            if (true) { // autofit.prop('checked')) {
                setTimeout(function() {
                    if (orientation === "horizontal") {
                        sizeToWidth(preview);
                    } else {
                        preview.css('font-size', (parseFloat(preview.data('max-font-size')) || 288) + 'px');
                        var padding = preview.position().top;
                        var pheight = preview.height();
                        var wheight = win.height() - padding*2;
                        var ratio = wheight / pheight;
                        if (ratio < 1) {
                            var newsize = parseFloat(preview.css('font-size')) * ratio;
                            preview.css('font-size', newsize+'px');
                        }
                    }
                }, 10);
            }

            setURL();
            $('#code').remove();

            if (false && evt) {
                if (evt.type !== 'input') {
                    // don't update SVG while slider is moving
                    setTimeout(doSVG);
                }
            }
        }

        function handleColor(layer, newcolor, silent) {
            var cssrule = 'background-color'; //layer.hasClass('background') ? 'background-color' : 'color';
            if (newcolor) {
                layer.next().val(newcolor.toHex8());
                layer.removeClass('none').css(cssrule, newcolor.toRgbString());
                if (layer.hasClass('background')) {
                    $('#tester').css('background-color', newcolor.toRgbString());
                }
            } else {
                layer.next().val("");
                layer.addClass('none').css(cssrule, 'transparent');
                if (layer.hasClass('background')) {
                    $('#tester').css('background-color', '');
                }
            }
            if (!silent) {
                updatePreview();
            }
        }

        layercontrols.each(function() {
            var layer = $(this);
            var cssrule = 'background-color'; //layer.hasClass('background') ? 'background-color' : 'color';
            layer.spectrum({
                'color': layer.css(cssrule),
                'showInput': true,
                'showAlpha': true,
                'showButtons': false,
                'showInitial': true,
                'allowEmpty': true,
                'containerClassName': 'color-picker-container',
                'preferredFormat': 'hex',
                'appendTo': '#tester',
                'move': function(newcolor) {
                    presetcontrols.prop('checked', false);
                    handleColor(layer, newcolor);
                    if (!newcolor) {
                        layer.spectrum('hide');
                    }
                }
            });
            //create hidden input for ease of serialization
            layer.after('<input type="hidden" class="layercolors" name="' + layer.data('layer') + '" value="' + layer.spectrum('get').toHex8() + '">');
        });

        //process initial url
        if (window.location.search.length > 1) {
            //$('input[type=checkbox], input[type=radio]').prop('checked', false);
            $.each(window.location.search.substr(1).split('&'), function(i,clause) {
                var eq = clause.split('=', 2);
                var input, layer;
                switch (eq[0]) {
                    case 'text':
                        textcontrol.val(Bungee.cleanupText(decodeURIComponent(eq[1].replace(/\+/g, '%20'))));
                        break;
                    case 'inline': case 'outline': case 'regular': case 'shade': case 'background': case 'sign':
                        input = $('#controls input.layercontrols[name=' + eq[0] + ']').val(eq[1]);
                        layer = layercontrols.filter('.' + eq[0]);
                        if (eq[1]) {
                            layer.spectrum('set', eq[1]);
                            handleColor(layer, layer.spectrum('get'), true);
                        } else {
                            handleColor(layer, null, true);
                        }
                        break;

                    default:
                        input = allcontrols.filter('[name=' + eq[0] + '][value="' + eq[1] + '"]');
                        input.prop('checked', true);
                        break;
                }
            });
        }

        updatePreview();
        //doSVG();

        allcontrols.on('change', updatePreview);
        textcontrol.on('keyup', updatePreview);

        $('#view-code').on('click', function() {
            var code = getCode();

            $('#code').remove();
            
            var out = $("<fieldset id='code'></fieldset>");
            out.html(code);
            
            $('#save-share').after(out);
            return false;
        })

    }); //window.onload
})();
