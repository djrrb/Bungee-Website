<?php
namespace CLC\Bungee;

# Create an SVG rendering of layered type set in Bungee
# DJR: http://djr.com/
# Code © 2015 Chris Lewis <info@chrislewis.codes>. All rights reserved.

define('DEBUG', isset($_GET['debug']));

if (!function_exists('uniord')) {
    # from http://stackoverflow.com/a/18499265
    function uniord($char) {
        return ltrim(bin2hex(mb_convert_encoding($char, "UTF-32BE")), "0");
    }
}

function color2CSS($color) {
    $css = array('stroke:none');
    if (preg_match('/^[0-9a-f]{8}$/', $color)) {
        $css[] = 'fill:#' . substr($color, 2);
        $opacity = hexdec(substr($color, 0, 2))/255;
        if ($opacity < 1) {
            $css[] = "opacity:$opacity";
        }
    } elseif (preg_match('/^[0-9a-f]{3}|[0-9a-f]{6}$/', $color)) {
        $css[] = "fill:#$color";
    } else {
        $css[] = "fill:$color";
    }
    return implode(';', $css);
}

$layers = array();
foreach (array('background', 'sign', 'shade', 'outline', 'regular', 'inline') as $layer) {
    if (isset($_GET[$layer])) {
        $layers[$layer] = $_GET[$layer];
    }
}

//regular needs to be there even if it's invisible
if (!isset($layers['regular'])) {
    $layers['regular'] = '00000000';
}

$orientation = isset($_GET['orientation']) ? $_GET['orientation'] : 'horizontal';
$text = isset($_GET['text']) && is_string($_GET['text']) && strlen($_GET['text']) ? $_GET['text'] : "Hello!";
$size = isset($_GET['size']) && is_numeric($_GET['size']) ? (int)$_GET['size'] : 144;
$ss = !empty($_GET['ss']) ? explode(',', $_GET['ss']) : array();
$block = !empty($_GET['block']) ? dechex($_GET['block']) : false;
$begin = !empty($_GET['begin']) ? dechex($_GET['begin']) : false;
$end = !empty($_GET['end']) ? dechex($_GET['end']) : false;
$format = !empty($_GET['format']) ? $_GET['format'] : 'svg';

#stylesets should be sorted numerically, except ss01 last
if ($block) {
    #block shapes always get ss01
    $ss[] = 'ss01';
    $begin = $end = false;
} else if ($begin or $end) {
    $block = false;
}

#cleanup on aisle ss
$ss = array_unique($ss);
sort($ss);
$ss01 = array_search('ss01', $ss);

if ($ss01 !== false) {
    #ss01 always needs to be at the end
    unset($ss[$ss01]);

    #ss01 not needed in vertical mode
    if ($orientation !== 'vertical') {
        $ss[] = 'ss01';
    }
}

#calculate size
$xpadding = round($size*0.1 + 18);
$ypadding = $begin == 'e15a' || $end == '27a1' ? $xpadding + $size*0.1 : $xpadding;

$height = round($size + $ypadding*2);
//width will be determined by text length


#what characters do we actually need?
$subset = array();
for ($i=0, $l=mb_strlen($text); $i<$l; $i++) {
    $subset[uniord(mb_substr($text, $i, 1))] = true;
}
if ($block) { 
    $subset[$block] = true; 
}
if ($begin) {
    $subset[$begin] = true;
}
if ($end) {
    $subset[$end] = true;
}
if ($begin or $end) {
    $subset[uniord("█")] = true; //block shape!
}
$subset = array_keys($subset);

#load up alternates and figure out character mappings
$allalts = json_decode(file_get_contents('bungee_gsub.json'), true);

#figure out character mappings
$myalts = array();
foreach ($subset as $orighex) {
    if ($orighex === "notdef") {
        continue;
    }

    $replacement = hexdec($orighex);
    foreach ($ss as $styleset) {
        if (isset($allalts[$styleset][$replacement])) {
            #update value and keep going
            $replacement = $allalts[$styleset][$replacement];
        }
    }
    $myalts[$orighex] = dechex($replacement);
}

#update subset to use alternates
$subset = array_fill_keys(array_values($myalts), true);

$kerns = array();

# Font definitions

$charwidths = array();
$em = 1000;
$baseline = 0;

$em2px = $size / $em;

ob_start();

print "<defs>";

foreach ($layers as $style => $color) {
    $fontfile = "../fonts/svg/Bungee_Layers" . ($orientation==='vertical' ? '_Rotated' : '') . "-" . ucfirst($style) . ".svg";
    if (!file_exists($fontfile)) {
        continue;
    }
    $font = file_get_contents($fontfile);
    preg_match_all('/<(font-face|glyph|missing-glyph|hkern)\b(.*?)>/u', $font, $matches, PREG_SET_ORDER);
    foreach ($matches as $m) {
        $tag = $m[1];

        preg_match_all('/(\S+)="(.*?)"/u', $m[2], $amatch, PREG_PATTERN_ORDER);
        $attr = array_combine($amatch[1], $amatch[2]);

        switch ($tag) {
            case 'font-face':
                if (isset($attr['units-per-em'])) {
                    $em = (int)$attr['units-per-em'];
                }
                if (isset($attr['descent'])) {
                    $baseline = -$attr['descent'];
                }
                break;
                
            case 'missing-glyph':
                if (!empty($attr['d'])) {
                    print "<path id='$style-notdef' d='{$attr['d']}' />";
                }
                $charwidths[$style]['notdef'] = (int)$attr['horiz-adv-x'];
                break;
            
            case 'glyph':
                if (!isset($attr['unicode'])) {
                    break;
                }

                $id = uniord(html_entity_decode($attr['unicode']));

                if (isset($subset[$id])) {
                    if (isset($attr['d'])) {
                        print "<path id='$style-$id' d='{$attr['d']}' />";
                    }
                    $charwidths[$style][$id] = (int)$attr['horiz-adv-x'];
                }
                break;
            
            case 'hkern': 
                $firsts = explode(',', $attr['u1']);
                $seconds = explode(',', $attr['u2']);
                $kern = -$attr['k'];
                foreach ($firsts as $u1) {
                    if ($u1 === '') {
                        $u1 = ',';
                    }
                    $u1 = html_entity_decode($u1);
                    $u1 = uniord($u1);
                    foreach ($seconds as $u2) {
                        if ($u2 === '') {
                            $u2 = ',';
                        }
                        $u2 = html_entity_decode($u2);
                        $u2 = uniord($u2);
                        if (isset($subset[$u1]) and isset($subset[$u2])) {
                            $kerns[$u1][$u2] = $kern;
                        }
                    }
                }
                break;
        }
    }
}

print "</defs>";

$svgdefs = ob_get_clean();

ob_start();

print "<!-- Text: " . str_replace('--', '- -', str_replace('--', '- -', $text)) . " (" . mb_strlen($text) . " bytes) -->";

# blocks
$blockwidth = 0;
if ($block and isset($layers['sign'])) {
    $blockwidth = $charwidths['regular'][$block];
    $color = $layers['sign'];
    if (!isset($charwidths[$style][$block])) {
        continue;
    }
    $x = $xpadding;
    $y = $height-$ypadding-$baseline*$em2px;
    for ($i=0,$l=mb_strlen($text); $i<$l; $i++) {
        print "<use transform='translate($x $y) scale($em2px -$em2px)' xlink:href='#regular-$block' style='" . color2CSS($color) . "' />";
        $x += $charwidths[$style][$block]*$em2px;
    }
}

# Text layers output

$shadenudge = isset($layers['shade']) ? 0.04 * $size : 0.0;
$textwidth = 0;
foreach ($layers as $style => $color) {
    switch ($style) {
        case 'background': case 'sign':
            break;
        
        default:
            $x = $xpadding;
            if ($block) {
                if ($orientation === 'vertical') {
                } else {
                    $x += $blockwidth*$em2px*0.109375;
                }
            }
            $y = $height-$ypadding - $baseline*$em2px;
            $x += $shadenudge * ($orientation === 'vertical' ? -1 : 1);
            $y -= $shadenudge;
            $prev = null;
            for ($i=0,$l=mb_strlen($text); $i<$l; $i++) {
                $c = mb_substr($text, $i, 1);
                $id = uniord($c);
                if (isset($myalts[$id])) {
                    $id = $myalts[$id];
                }
                if (!isset($charwidths[$style][$id])) {
                    $id = 'notdef';
                }
                if (!$block and isset($kerns[$prev][$id])) {
                    $x += $kerns[$prev][$id]*$em2px;
                }
        
                $ss01fudge = 0;
                if ($orientation === 'vertical' and $block) {
                    #this fakes the modified ss01 sidebearings to do simple vertical centering
                    $ss01fudge = ($blockwidth*$em2px - $charwidths[$style][$id]*$em2px)/2;
                    $x += $ss01fudge;
                }
                print "<!-- $c --> <use transform='translate($x $y) scale($em2px -$em2px)' xlink:href='#{$style}-$id' style='" . color2CSS($color) . "' />";
                $x += $block ? $blockwidth*$em2px - $ss01fudge : $charwidths[$style][$id]*$em2px;
                $prev = $id;
            }
            $textwidth = max($textwidth, $x - $xpadding);
            break;
    }

}

$textcontent = ob_get_clean();

ob_start();

#banner!
$bannerwidth = 0;
$beginwidth = 0;
if (($begin or $end) and isset($layers['sign'])) {
    if ($begin) {
        $beginwidth = $charwidths['regular'][$begin];
    }
    $color = $layers['sign'];
    $x = $xpadding;
    $y = $height-$ypadding-$baseline*$em2px;
    if ($begin) {
        print "<use transform='translate($x $y) scale($em2px -$em2px)' xlink:href='#regular-$begin' style='" . color2CSS($color) . "' />";
        $x += $charwidths[$style][$begin]*$em2px;
    }
    $id = uniord("█");
    #squeeze blocks into slightly smaller space
    $blockwidth = $charwidths[$style][$id]*$em2px;
    $remainder = fmod($textwidth, $blockwidth);
    if ($remainder) {
        $numberofblocks = ceil($textwidth / $blockwidth);
        $advancewidth = (($numberofblocks-2)*$blockwidth + $remainder) / ($numberofblocks-1); //work shown upon request
    } else {
        $numberofblocks = $textwidth/$blockwidth;
        $advancewidth = $blockwidth;
    }
    for ($i=0; $i<$numberofblocks; $i++) {
        print "<use transform='translate($x $y) scale($em2px -$em2px)' xlink:href='#regular-$id' style='" . color2CSS($color) . "' />";
        $x += $advancewidth;
    }
    $x += $blockwidth - $advancewidth;
    if ($end) {
        print "<use transform='translate($x $y) scale($em2px -$em2px)' xlink:href='#regular-$end' style='" . color2CSS($color) . "' />";
        $x += $charwidths[$style][$end]*$em2px;
    }
    $bannerwidth = $x - $xpadding;
}

$bannercontent = ob_get_clean();

ob_start();

#now we have all the information we need to calculate the final dimensions
$width = round(max($textwidth, $bannerwidth) + 2*$xpadding);

if ($orientation === 'vertical') {
    print "<g transform='rotate(90) translate(0,-$height)'>";
}

print $bannercontent;

if ($begin) {
    print "<g transform='translate(" . ($beginwidth*$em2px) . " 0)'>";
}

print $textcontent;

if ($begin) {
    print "</g>";
}

if ($orientation === 'vertical') {
    print "</g>";
    $temp = $width;
    $width = $height;
    $height = $temp;
}

$svgcontent = ob_get_clean();


ob_start();

print "<?xml version='1.0' encoding='utf-8' ?>";
print '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
print "<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='$width' height='$height'>";

print $svgdefs; unset($svgdefs);

#border
#print "<rect x='0' y='0' width='$width' height='$height' stroke='black' fill='transparent'/>";

#background!
if (isset($layers['background'])) {
    print "<rect x='0' y='0' width='$width' height='$height' style='" . color2CSS($layers['background']) . "' />";
}


print $svgcontent; unset($svgcontent);

print "</svg>";

$output = ob_get_clean();

$tempdir = sys_get_temp_dir();
$outfile = $tempfile = tempnam($tempdir, 'bungee-svg-');
file_put_contents($tempfile, $output);

function convert($args) {
    $cmd = '/usr/local/bin/inkscape';
    foreach ($args as $k => $v) {
        $cmd .= " {$k} " . escapeshellarg($v);
    }
    exec($cmd, $output, $err);
}

switch ($format) {
    case 'pdf':
        header("Content-type: application/pdf");
        $outfile = tempnam($tempdir, 'bungee-pdf-');
        convert(array('-f' => $tempfile, '-A' => $outfile));
        break;
    case 'png':
        header("Content-type: image/png");
        $outfile = tempnam($tempdir, 'bungee-png-');
        convert(array('-f' => $tempfile, '-e' => $outfile, '-d' => 180));
        break;
    default: //svg
        $format = 'svg';
        if (DEBUG) {
            header("Content-type: text/plain; charset=utf-8");
            $output = str_replace("><", ">\n<", $output);
        } else {
            header("Content-type: image/svg+xml");
        }
}

$safetext = "Bungee-" . preg_replace('/[^\w-]+/u', '-', $text);

clearstatcache();

header("Content-disposition: " . (isset($_GET['download']) ? 'attachment' : 'inline') . "; filename=$safetext.$format");

if (DEBUG) {
    header("Cache-control: no-cache");
    print $output;
} else {
    header("Cache-control: max-age=3600");
    header("Content-length: " . filesize($outfile));
    readfile($outfile);
}

unlink($tempfile);
if ($tempfile !== $outfile) {
    unlink($outfile);
}

exit(0);
