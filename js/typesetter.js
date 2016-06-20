
(function() {
    "use strict";

    var win = $(window);
    var presetsLoaded=false, winLoaded=false;

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
                presetsLoaded = true;
                if (winLoaded) {
                    onLoad();
                }
            });
        }
    });

    function onLoad() {
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

        var suckyBrowser = $('html').hasClass('no-vertical-text');
        
        var previewPreInit;
        
        function getCode() {
            var tab = "  ";
            var code = "";
            
            code += "<!DOCTYPE html><html><head>\n";
            code += tab + '<link rel="stylesheet" href="https://bungee-project.djr.com/resources/web/bungee.css">\n';
            code += tab + '<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js"></script>\n';
            code += tab + '<script src="https://bungee-project.djr.com/resources/web/bungee.js"></script>\n';
            code += "</head><body>\n";

            var el = previewPreInit[0];
            el.removeAttribute('id');
            el.removeAttribute('data-max-font-size');
            
            code += tab + el.outerHTML.replace(/>(.*)</g, '>\n' + tab + tab + "$1\n" + tab + "<") + "\n";
            code += "</body></html>";
            
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
    
        function getPermalink() {
            var url = $('#controls').serialize();
            return '?' + url + '#' + preview.closest('section').prop('id');
        }
        
        function getSvgURL() {
            var req = {};
            req.text = Bungee.cleanupText(textcontrol.val());
            req.size = 144;
            req.orientation = orientationcontrols.filter(':checked').val();
            layercontrols.not('.none').each(function() {
                var swatch = $(this);
                var layer = swatch.data('layer');
                var color = swatch.spectrum('get').toHex8();
                req[layer] = color;
            });
            backgroundcontrols.filter(':checked').each(function() {
                req[this.name] = Bungee[this.name + 'Chars'][this.value];
            })
            req.ss = [];
            altcontrols.filter(':checked').each(function() {
                req.ss.push(Bungee.stylisticAlternates[this.value]);
            });
            req.ss = req.ss.join(',');
            
            return 'svg/svg.php?' + $.param(req) + '&download';
        }

        function getPngURL() {
            return getSvgURL() + '&format=png';
        }

        function getPdfURL() {
            return getSvgURL() + '&format=pdf';
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
            
            if (suckyBrowser && orientation === 'vertical') {
                // replace with SVG
                preview.html('<img src="' + getSvgURL() + '" alt="SVG preview">');
            } else {
                Bungee.init(preview);
                
                if (true) { // autofit.prop('checked')) {
                    var oldsize = sizeToWidth.cssToPx(preview.data('max-font-size')) || 144;
                    preview.css('font-size', oldsize + 'px');
                    var fitToWidth = function() {
                        if (orientation === 'horizontal') {
                            sizeToWidth(preview); 
                        } else {
                            var padding = preview.position().top;
                            var pheight = preview.prop('scrollHeight');
                            var wheight = win.height() - padding*3.1;
                            var ratio = wheight / pheight;
                            if (ratio < 1) {
                                preview.css('font-size', (oldsize * ratio)+'px');
                            }
                        }
                    }
                    
                    fitToWidth();
                    win.on('resize', fitToWidth);
                }
            }

            $('#code').remove();
            $('#permalink').prop('href', getPermalink());
            $('#download-svg').prop('href', getSvgURL());
            $('#download-png').prop('href', getPngURL());
            $('#download-pdf').prop('href', getPdfURL());
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

        allcontrols.on('change', updatePreview);
        textcontrol.on('keyup', updatePreview);

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
            updatePreview();
        } else {
            $('#preset-default').prop('checked', true).trigger('change');
        }

        $('#view-code').on('click', function() {
            var code = getCode();

            $('#code').remove();
            
            var out = $("<code class='content' id='code'></code>");
            out.html(code);
            
            $('#save-share').append(out);
            return false;
        })

        $('a[id^="download-"]').on('click', function() {
            window.history.replaceState({}, "", getPermalink());
            return true;
        });

    } //onLoad

    win.on('load', function() {
        winLoaded = true;
        if (presetsLoaded) {
            onLoad();
        }
    });
})();
