# Fluid Circles Visualization

An interactive visualization showing circles that grow and shrink fluidly, representing team or project components.

## Features

- **Automatic Animation**: Circles grow and shrink automatically when animation is started
- **People Flow Animation**: 
  - Animated dotted lines with moving dash patterns show flow direction
  - Animation speed varies based on flow rate between circles
  - Animated particles represent people moving along the paths
  - Circles dynamically resize based on inflow/outflow of people
  - Source circles get smaller as people leave
  - Target circles get larger as people arrive
- **Interactive Controls**: 
  - Start/Stop animation
  - Reset to original sizes
  - Manual size control with slider
  - Select specific circles or all circles
- **Click Interaction**: Click any circle to toggle between normal and enlarged size
- **Hover Effects**: Hover over circles to see details and highlight connected flow paths

## How to Use

1. Open `index.html` in a web browser
2. Use the controls at the top to:
   - Start/Stop the automatic animation
   - Reset circles to their original sizes
   - Manually adjust circle sizes using the slider
3. Click on any circle to make it grow or shrink
4. Hover over circles to see tooltips

## Technical Details

Built with:
- HTML5
- CSS3
- JavaScript
- D3.js (v7) for visualization

## Customization

You can modify the circle data in `script.js` to change:
- Circle names
- Colors
- Base sizes
- Positions
