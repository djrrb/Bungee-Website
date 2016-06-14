import json
import yaml
import struct
from AppKit import NSColor

def makeColor(hexValue, a=1):
    if not hexValue:
        return None
    if hexValue[0] == '#':
        hexValue = hexValue[1:]
    r, g, b = struct.unpack('BBB',hexValue.decode('hex'))
    return NSColor.colorWithCalibratedRed_green_blue_alpha_(r/255, g/255, b/255, a)
    
def makeHex(c):
    r, g, b, a = c.getRed_green_blue_alpha_(None, None, None, None)
    rgb = r*255, g*255, b*255
    return '%02x%02x%02x' % rgb



path = u"/Users/david/Documents/web/Bungee-Website/data/_bungee-colors.yml"


with open(path, 'r') as indexfile:
    palettes = yaml.load( file.read(indexfile) )
    jsonpath = path.replace('.yml', '.json')
    
    # write to JSON file
    with open(jsonpath, 'w') as writefile:
        writefile.write(json.dumps(palettes))
        writefile.close()

    size(1000, 120*len(palettes))
    fill(.5)
    rect(0, 0, width(), height())

    block = unichr(11035)
    layerOrder = ['inline', 'regular', 'outline', 'shade', 'sign', 'background']

    textLayers = layerOrder[:4]
    textLayers.reverse()

    sample = 'TESTING 123'
    
    turnoffable = True

    fontSize(100)

    for palette in palettes:
        save()
        fill(makeColor(str(palette['background']['hex'])))

        rect(0, 0, width(), 120)
    
        save()
        font('InputSans', 12)
        fill(makeColor(str(palette['regular']['hex'])))
        text(palette['name'], (800, 20))
        restore()

        translate(25, 25)
        
        #if palette.get('signOutline'):
        #    font('BungeeLayers-Outline')
        #    fill(makeColor(palette['signOutline']))
        #    text(block, (0, 0))

        if palette.get('sign'):
            if turnoffable and palette['sign'].get('active') == False:
                print 'ignoring sign'
            else:
                font('BungeeLayers-Regular')
                fill(makeColor(str(palette['sign']['hex'])))
                text(block, (0, 0))
        
        for textLayer in textLayers:
            if palette.get(textLayer):
                if turnoffable and palette[textLayer].get('active') == False:
                    print 'ignoring', textLayer
                else:
                    font('BungeeLayers-%s' % textLayer[0].upper()+textLayer[1:])
                    a = 1
                    if palette[textLayer].has_key('alpha'):
                        a = palette[textLayer]['alpha']
                    fill(makeColor(str(palette[textLayer]['hex']), a=a))
                    text(sample, (0, 0))
    
        restore()
        translate(0, 120)
