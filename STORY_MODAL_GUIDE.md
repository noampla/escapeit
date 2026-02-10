# Story Modal Guide

This guide explains how to add an intro/help modal to your theme. The modal shows automatically when a player first enters a level and can be reopened using the "📖 Help" button.

## Overview

The story modal is an optional feature that provides:
- **Story Tab**: Narrative/introduction to set the scene
- **Controls Tab**: Keyboard controls and basic gameplay
- **Elements Tab**: Visual guide to all tiles, items, and obstacles
- **Tips Tab**: Strategy hints and gameplay tips

## Implementation Steps

### 1. Create `story.js` File

Create a new file in your theme directory: `themes/your-theme/story.js`

```javascript
// Theme Story and Tutorial Content

export const STORY = {
  title: 'Your Theme Name',

  // Introduction story
  intro: `Write your theme's story here.
You can use multiple paragraphs.

Each paragraph will be displayed separately.`,

  // Controls section
  controls: {
    title: 'How to Play',
    items: [
      { key: 'Arrow Keys / WASD', description: 'Move your character' },
      { key: 'F', description: 'Pick up items from the ground' },
      { key: 'E (hold)', description: 'Interact with objects' },
      { key: 'T', description: 'Use/wear equipment' },
      { key: 'R', description: 'Restart level' },
      { key: 'ESC', description: 'Exit to menu' }
    ]
  },

  // Elements/tiles section
  tiles: {
    title: 'Game Elements',
    sections: [
      {
        category: 'Obstacles',
        items: [
          {
            name: 'Wall',
            tileType: 'wall', // Use tileType for tiles
            description: 'Cannot pass through walls.'
          },
          // Add more tiles...
        ]
      },
      {
        category: 'Items',
        items: [
          {
            name: 'Key',
            itemType: 'key', // Use itemType for items
            description: 'Opens locked doors.'
          },
          // Add more items...
        ]
      }
    ]
  },

  // Tips section
  tips: {
    title: 'Tips & Strategy',
    items: [
      '💡 Explore every corner of the map',
      '🎯 Plan your route before moving',
      '⚡ Save power-ups for difficult sections',
      // Add more tips...
    ]
  }
};

// Export functions (required)
export function getStoryContent() {
  return STORY;
}

export function hasStoryContent() {
  return true;
}
```

### 2. Icon Rendering

For the Elements tab, you can specify how each element displays:

**Using Tile Rendering:**
```javascript
{
  name: 'Security Door',
  tileType: 'door-card',  // Will render using theme's renderTile()
  description: 'Requires matching keycard to unlock.'
}
```

**Using Item Rendering:**
```javascript
{
  name: 'Keycard',
  itemType: 'card',  // Will render using theme's renderInventoryItem()
  description: 'Use to unlock security doors.'
}
```

**Using Emoji Fallback:**
```javascript
{
  name: 'Exit',
  emoji: '🚪',  // Falls back to emoji if no tileType/itemType
  description: 'Reach this to complete the level.'
}
```

The modal automatically:
- Uses `theme.renderTile()` or `theme.renderInventoryItem()` for custom rendering
- Falls back to emojis from `getTileEmoji()` or `getItemEmoji()` if available
- Displays plain emoji as last resort

### 3. That's It!

The theme loader automatically:
1. Detects the `story.js` file in your theme
2. Loads it when the theme is loaded
3. Shows the modal on first level entry (once per browser session)
4. Adds the "📖 Help" button to reopen it

**No additional configuration needed!**

## Best Practices

### Content Writing
- Keep the intro story concise (2-4 paragraphs)
- Focus story on atmosphere and motivation
- Make controls clear and complete
- Include all important tiles/items in Elements
- Add 4-8 practical tips

### Icon References
- **Always use `tileType` or `itemType`** instead of emoji when possible
- This ensures icons match the actual game graphics
- Only use `emoji` for elements without tile/item types

### Organization
- Group related elements under clear categories
- Order by importance (core mechanics first)
- Use descriptive category names:
  - ✅ "Doors & Access", "Hazards", "Items"
  - ❌ "Stuff", "Things", "Other"

### Descriptions
- Be specific and actionable
- Mention required items or conditions
- Explain what happens on interaction
- Keep each description to 1-2 sentences

## Example Structure

```javascript
tiles: {
  title: 'Game Elements',
  sections: [
    {
      category: 'Core Mechanics',
      items: [
        { name: 'Start', tileType: 'start', description: '...' },
        { name: 'Exit', tileType: 'exit', description: '...' }
      ]
    },
    {
      category: 'Obstacles',
      items: [
        { name: 'Wall', tileType: 'wall', description: '...' },
        { name: 'Locked Door', tileType: 'door', description: '...' }
      ]
    },
    {
      category: 'Collectibles',
      items: [
        { name: 'Key', itemType: 'key', description: '...' },
        { name: 'Coin', itemType: 'coin', description: '...' }
      ]
    }
  ]
}
```

## Customization

The modal styling is defined in `src/components/StoryModal.css`. The default styling uses:
- Dark theme with gradient backgrounds
- Red accent color (#e94560)
- Cyan secondary color (#4ecdc4)

You can customize per-theme by adding theme-specific CSS classes or creating a theme-specific modal component if needed.

## Testing

1. Start a new game with your theme
2. Modal should appear automatically
3. Test all tabs (Story, Controls, Elements, Tips)
4. Verify all icons render correctly
5. Test reopening via "📖 Help" button (ESC menu in solver mode)

## Troubleshooting

**Modal doesn't appear:**
- Check that `story.js` exists in `themes/your-theme/`
- Verify exports: `getStoryContent()` and `hasStoryContent()`
- Check browser console for errors

**Icons not rendering:**
- Verify `tileType` matches your `TILE_TYPES` keys
- Verify `itemType` matches your `ITEM_TYPES` keys
- Check that `renderTile()` and `renderInventoryItem()` work correctly

**Modal shows every time:**
- This is expected per browser session
- Clear browser's `sessionStorage` to reset
- Use `localStorage` if you want permanent "seen" storage

## Reference Implementation

See `themes/mad-science-lab/story.js` for a complete example with:
- Multi-paragraph story
- 6 control items
- 10+ game elements across 3 categories
- 6 strategic tips
- Mix of tileType, itemType, and emoji usage
