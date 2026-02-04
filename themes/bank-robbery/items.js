// Bank Robbery Theme - Item Definitions

export const ITEM_TYPES = {
  // Items will be added here
};

export function renderItem(ctx, itemType, x, y, size, state = null) {
  // Custom rendering will be added here
  return false;
}

export function getItemEmoji(itemType) {
  const item = ITEM_TYPES[itemType];
  return item?.emoji || null;
}
