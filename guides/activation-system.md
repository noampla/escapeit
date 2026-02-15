# Activation System Guide

The activation system allows doors and gates to be opened by placing specific items at specific positions on the map. This enables escape room style puzzles like "place the cat drawing on the pedestal to open the gate".

## Supported Tiles

The following tiles support activation requirements:
- `door-key` - Key-locked doors
- `door-card` - Card-locked doors
- `ancient-gate` - Ancient gates (forest theme)

## How to Configure

### 1. Place the Activatable Tile

Place a door or gate on your map in the level builder.

### 2. Select the Tile

Click on the tile in Edit mode (or Shift+click) to open its properties panel.

### 3. Enable Activation

In the properties panel, find "Item Activation" and check "Enable activation".

### 4. Add Requirements

Click "+ Add" to add a requirement. Each requirement specifies:
- **Position (X, Y)**: Where the item must be placed
- **Item ID**: Which item must be placed there

### 5. Set Position

You can either:
- Type the X and Y coordinates directly
- Click the "Pick" button, then click on the map to select a position

The position will be highlighted with an orange marker on the map.

### 6. Select Item ID

Choose an item ID from the dropdown. The dropdown shows all available IDs on the map:
- **imageId** values from drawing boards (e.g., "cat", "key", "map")
- **item type** suffixes (e.g., "key", "torch", "bucket")

### 7. Order Matters (Optional)

Check "Order matters" if items must be placed in a specific sequence. When enabled:
- Items must be placed in the order listed (1, 2, 3...)
- Placing items out of order won't trigger activation
- Numbers are shown on the map markers

## Creating Matchable Items

### Drawing Boards

1. Place an `item-drawing-board` tile on the map
2. Select it and configure:
   - **Image ID**: A unique identifier (e.g., "cat", "symbol1")
   - **Drawing**: Click to draw the image
   - **Pickable**: Check to allow players to pick it up

### Other Items

Regular items use their type suffix as the ID:
- `item-key` matches ID "key"
- `item-torch` matches ID "torch"
- `item-bucket` matches ID "bucket"

## How Activation Works

1. Player picks up an item (F key)
2. Player moves to the target position
3. Player drops the item (G key)
4. System checks all activation requirements
5. If all requirements are met (and in order if enabled):
   - Door/gate opens automatically
   - "Puzzle solved!" message appears
   - Unlock sound plays

## Example: Simple Puzzle

**Goal**: Open a gate by placing a "sun" drawing on a pedestal

1. Place an `ancient-gate` tile
2. Enable activation, add requirement at position (5, 3) with itemId "sun"
3. Place an `item-drawing-board` elsewhere with:
   - imageId: "sun"
   - Draw a sun image
   - pickable: true
4. Player picks up the drawing, drops it at (5,3), gate opens!

## Example: Ordered Puzzle

**Goal**: Open a door by placing three symbols in order

1. Place a `door-key` tile
2. Enable activation with "Order matters" checked
3. Add requirements:
   - #1: Position (3, 5), itemId "circle"
   - #2: Position (4, 5), itemId "triangle"
   - #3: Position (5, 5), itemId "square"
4. Place three drawing boards with matching imageIds
5. Player must place them in order: circle first, then triangle, then square

## Tips

- Use descriptive imageIds that hint at the puzzle solution
- Place visual markers (floor tiles, signs) to guide players
- Test your puzzle thoroughly in play mode
- Consider adding a hint system for complex puzzles
