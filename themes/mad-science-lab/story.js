// Mad Science Lab Theme - Story and Tutorial Content

export const STORY = {
  title: 'Mad Science Lab',

  // Intro story shown when entering the level
  intro: `You wake up in a mysterious laboratory. The air is thick with the smell of chemicals,
and strange equipment hums around you. Red lights flash - something has gone terribly wrong
with the experiments.

Your mission: Navigate through the hazardous lab, unlock secured areas, and find the emergency
exit before it's too late!`,

  // Controls and basic gameplay
  controls: {
    title: 'How to Play',
    items: [
      { key: 'Arrow Keys / WASD', description: 'Move your character' },
      { key: 'F', description: 'Pick up items from the ground' },
      { key: 'E (hold)', description: 'Interact with doors, terminals, and use consumables' },
      { key: 'T', description: 'Wear or remove equipment (like hazmat suit)' },
      { key: 'R', description: 'Restart level' },
      { key: 'ESC', description: 'Exit to menu' }
    ]
  },

  // Explanation of tiles and objects
  tiles: {
    title: 'Lab Elements',
    sections: [
      {
        category: 'Doors & Access',
        items: [
          {
            name: 'Security Door (Keycard)',
            tileType: 'door-card',
            description: 'Locked with a colored security system. Find the matching colored keycard to unlock.'
          },
          {
            name: 'Chemical-Sealed Door',
            tileType: 'door-chemical',
            description: 'Blocked by a chemical barrier. Use a matching colored chemical vial to neutralize and open.'
          },
          {
            name: 'Access Terminal',
            tileType: 'terminal',
            description: 'Computer terminal that controls the lab systems. Requires a Data Tablet AND Power Cell to activate. Disables all laser grids!'
          }
        ]
      },
      {
        category: 'Hazards',
        items: [
          {
            name: 'Toxic Spill',
            tileType: 'toxic_spill',
            description: 'Dangerous chemical spill. Causes continuous damage. Wear a Hazmat Suit for protection.'
          },
          {
            name: 'Radiation Zone',
            tileType: 'radiation',
            description: 'Radioactive area. Causes continuous damage. Wear a Hazmat Suit for protection.'
          },
          {
            name: 'Laser Grid',
            tileType: 'laser_grid',
            description: 'Impassable laser security system. Cannot be crossed. Disable using a terminal.'
          },
          {
            name: 'Broken Glass',
            tileType: 'broken-glass',
            description: 'Shattered glass on the floor. Causes damage over time. Wear a Hazmat Suit for protection.'
          }
        ]
      },
      {
        category: 'Items',
        items: [
          {
            name: 'Keycard',
            itemType: 'card',
            description: 'Color-coded security card. Use to unlock matching security doors. Consumed on use.'
          },
          {
            name: 'Chemical Vial',
            itemType: 'chemical',
            description: 'Color-coded chemical compound. Use to neutralize matching chemical-sealed doors. Consumed on use.'
          },
          {
            name: 'Data Tablet',
            itemType: 'tablet',
            description: 'Electronic tablet with access codes. Required to hack terminals (along with a Power Cell).'
          },
          {
            name: 'Power Cell',
            itemType: 'battery',
            description: 'High-capacity battery. Required to power terminals. Consumed when activating a terminal.'
          },
          {
            name: 'Hazmat Suit',
            itemType: 'hazmat',
            description: 'Full-body protection suit. Press T to wear. Protects from toxic spills, radiation, and broken glass.'
          },
          {
            name: 'Medical Kit',
            itemType: 'medkit',
            description: 'Emergency medical supplies. Press E to use and restore 1 life. Can only be used when injured.'
          }
        ]
      }
    ]
  },

  // Tips and strategies
  tips: {
    title: 'Survival Tips',
    items: [
      '🔍 Explore carefully - check every room for items and hidden paths',
      '🎯 Match colors - keycards and chemical vials must match their door colors',
      '⚡ Plan ahead - you need BOTH tablet and power cell to disable lasers',
      '🦺 Protect yourself - wear the hazmat suit before entering hazardous areas',
      '❤️ Conserve health - use medical kits wisely, they\'re limited',
      '💡 Terminal strategy - activate terminals to create safe paths through laser grids'
    ]
  }
};

// Get the full story/tutorial content
export function getStoryContent() {
  return STORY;
}

// Check if theme has story content
export function hasStoryContent() {
  return true;
}
