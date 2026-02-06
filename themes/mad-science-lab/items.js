// Mad Science Lab Theme - Item Definitions

export const ITEM_TYPES = {
  // Items will be added as we expand the theme
};

// Render item on canvas (custom rendering)
export function renderItem(ctx, itemType, cx, cy, size, state = {}) {
  return false; // No custom rendering yet
}

// Render item in inventory
export function renderInventoryItem(ctx, itemType, cx, cy, size, state = {}) {
  return false; // No custom rendering yet
}

// Get emoji for item
export function getItemEmoji(itemType) {
  return null;
}

// Get label for item (with state info)
export function getItemLabel(itemType, state = {}) {
  const item = ITEM_TYPES[itemType];
  return item?.label || itemType;
}
