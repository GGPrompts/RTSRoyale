# RTS Arena - Input Controls Testing Guide

## How to Use the New Input System

To test the new RTS input controls, use the modified main file:

1. Replace the import in your HTML file:
   ```html
   <!-- Change from -->
   <script type="module" src="/src/main.ts"></script>

   <!-- To -->
   <script type="module" src="/src/main-with-input.ts"></script>
   ```

2. Also update the test-scene import in `main-with-input.ts`:
   ```typescript
   import { initTestScene } from './test-scene-with-viewport';
   ```

## Complete Input Controls Reference

### Selection Controls
- **Left-click on unit**: Select single unit (deselects others)
- **Shift + Left-click**: Add unit to current selection
- **Click + Drag**: Draw selection box to select multiple units
- **Shift + Box select**: Add boxed units to existing selection
- **Click empty space**: Deselect all units
- **Escape key**: Clear selection

### Control Groups (1-9)
- **Ctrl + 1-9**: Assign current selection to control group
- **1-9**: Recall control group (select those units)
- **Double-tap 1-9**: Jump camera to control group center
- **Tab**: Cycle through active control groups
- **Shift + Tab**: Cycle backwards through control groups

### Movement & Orders
- **Right-click ground**: Move selected units to position
- **Right-click enemy**: Attack-move to enemy (red indicator)
- Units move in formation when multiple selected

### Camera Controls
- **WASD or Arrow Keys**: Pan camera
- **Mouse Wheel**: Zoom in/out
- **Middle-click + Drag**: Pan camera
- **Edge Scrolling**: Move mouse near screen edge to pan

### Visual Feedback
- **Green circles**: Selected units
- **Green dashed box**: Selection area during drag
- **Green circle + crosshair**: Move target indicator
- **Red circle + crosshair**: Attack target indicator
- **Health bars**: Show when unit is damaged or selected
- **Yellow flash**: Control group assignment confirmation

## Testing Checklist

### Basic Selection
- [ ] Click on a blue unit - it should show green selection circle
- [ ] Click on another blue unit - previous unit deselected, new one selected
- [ ] Shift-click multiple units - all should remain selected
- [ ] Click empty space - all units deselected
- [ ] Click red unit - nothing happens (enemy units not selectable)

### Box Selection
- [ ] Click and drag to create green dashed box
- [ ] Release to select all blue units in box
- [ ] Box select with shift adds to existing selection
- [ ] Box corners have white highlights
- [ ] Box has semi-transparent green fill

### Control Groups
- [ ] Select units and press Ctrl+1 - see yellow flash confirmation
- [ ] Press 1 - units are recalled
- [ ] Assign different units to group 2
- [ ] Press Tab to cycle between groups 1 and 2
- [ ] Double-tap a number to center camera on that group

### Movement Orders
- [ ] Select units and right-click ground
- [ ] Green target indicator appears at destination
- [ ] Units move to target in formation
- [ ] Target indicator fades after 2 seconds
- [ ] Multiple units maintain relative positions

### Camera Controls
- [ ] WASD keys pan the camera smoothly
- [ ] Mouse wheel zooms in and out (0.5x to 2.0x)
- [ ] Middle-click and drag pans the camera
- [ ] Move mouse to screen edge for edge scrolling
- [ ] Camera stays within world bounds

### Performance Tests
- [ ] Select all 50 units with box select
- [ ] Move all 50 units at once
- [ ] Verify smooth 60 FPS with all units selected
- [ ] Test rapid selection changes
- [ ] Test rapid control group switching

## Debug Controls (Preserved)
- **0**: Reset to normal speed
- **1-4**: Speed up time (10x, 25x, 50x, 100x)
- **5**: Jump to next phase
- **R**: Reset game

## Known Limitations
- Control groups 1-4 conflict with speed controls when not using Ctrl
- Camera bounds are set to arena size + 500 units margin
- Selection is limited to player's team (blue/team 0)
- Attack orders currently just move units (combat system handles actual attacks)

## Files Created/Modified

### New Files Created:
1. `/apps/web/src/input/mouse.ts` - Mouse input handling
2. `/apps/web/src/input/keyboard.ts` - Keyboard input and control groups
3. `/apps/web/src/selection/selection.ts` - Selection state management
4. `/apps/web/src/selection/box-select.ts` - Box selection visualization
5. `/apps/web/src/camera.ts` - Camera control system
6. `/apps/web/src/rendering/selection-indicators.ts` - Visual feedback
7. `/apps/web/src/main-with-input.ts` - Main file with input integration
8. `/apps/web/src/test-scene-with-viewport.ts` - Updated test scene

### Integration Notes:
- Uses Pixi.js v8 EventSystem for input handling
- bitECS Selected component tracks selection state
- Target component used for movement orders
- Camera uses Container-based viewport for transformations
- Selection indicators rendered below units (zIndex: -1)

## Troubleshooting

If controls aren't working:
1. Check browser console for errors
2. Ensure you're using the correct main file
3. Verify canvas has focus (click on game area)
4. Check if correct team units are being spawned (team 0/blue)
5. Ensure viewport Container is properly initialized

## Next Steps
1. Integrate ability casting with selected units
2. Add attack-move pathfinding
3. Implement unit formations (box, line, wedge)
4. Add minimap with camera rectangle
5. Implement unit grouping by type
6. Add selection priority (prefer combat units over workers)