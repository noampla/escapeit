import { useRef, useEffect } from 'react';

// Default colors for common tile types across all themes
const TILE_COLORS = {
  // Basic terrain
  empty: '#0a0a0a',
  ground: '#3d5a28',
  floor: '#4a4a4a',
  tree: '#1a3a10',
  water: '#2266aa',
  snow: '#ddeeff',
  wall: '#444444',
  boulder: '#5a5a5a',
  'thorny-bush': '#3a5a2a',
  concrete: '#555555',
  carpet: '#6a4a3a',

  // Start/Exit
  campfire: '#cc6600',
  car: '#4488cc',
  start: '#cc6600',
  exit: '#4488cc',
  'exit-door': '#4488cc',

  // Hazards
  fire: '#ff4400',
  laser: '#ff0066',
  camera: '#666688',
  'laser-beam': '#ff0044',
  chemical: '#44ff44',
  tesla: '#8844ff',

  // Objects
  'item-key': '#ffdd00',
  'item-axe': '#aa6633',
  'item-bucket': '#5588bb',
  'item-rope': '#aa8855',
  'item-knife': '#cccccc',
  'item-sweater': '#cc4466',
  'item-wood': '#8b6914',
  'item-card': '#4444cc',
  'item-money': '#44aa44',
  'item-flashlight': '#ffff66',

  // Doors
  'door-key': '#884422',
  'door-card': '#445588',
  'door-key-open': '#553311',
  'door-card-open': '#334466',
  'vault-door': '#888866',
  'guard-door': '#886644',

  // NPCs
  friend: '#ff88cc',
  bear: '#8b4513',
  guard: '#aa4444',

  // Special
  raft: '#6699aa',
  vault: '#888866',
};

export default function MapPreview({ grid, size = 120 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid || !grid.length) return;

    const ctx = canvas.getContext('2d');
    const gridRows = grid.length;
    const gridCols = grid[0]?.length || 0;

    if (gridRows === 0 || gridCols === 0) return;

    // Find the bounding box of non-empty content to focus the preview
    let minX = gridCols, maxX = 0, minY = gridRows, maxY = 0;
    let hasContent = false;

    for (let y = 0; y < gridRows; y++) {
      for (let x = 0; x < gridCols; x++) {
        const cell = grid[y][x];
        const floorType = cell?.floor?.type || cell?.type;
        const objType = cell?.object?.type;

        if ((floorType && floorType !== 'empty') || objType) {
          hasContent = true;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }

    // If no content, use full grid
    if (!hasContent) {
      minX = 0;
      maxX = gridCols - 1;
      minY = 0;
      maxY = gridRows - 1;
    }

    // Add padding around content
    const padding = 2;
    minX = Math.max(0, minX - padding);
    maxX = Math.min(gridCols - 1, maxX + padding);
    minY = Math.max(0, minY - padding);
    maxY = Math.min(gridRows - 1, maxY + padding);

    const contentWidth = maxX - minX + 1;
    const contentHeight = maxY - minY + 1;

    // Calculate pixel size per tile to fit in canvas
    const scale = Math.min(size / contentWidth, size / contentHeight);
    const pixelSize = Math.max(1, scale);

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, size, size);

    // Center the content
    const renderedWidth = contentWidth * pixelSize;
    const renderedHeight = contentHeight * pixelSize;
    const offsetX = Math.floor((size - renderedWidth) / 2);
    const offsetY = Math.floor((size - renderedHeight) / 2);

    // Render each cell
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const cell = grid[y][x];
        if (!cell) continue;

        const px = offsetX + (x - minX) * pixelSize;
        const py = offsetY + (y - minY) * pixelSize;

        // Get floor color
        const floorType = cell.floor?.type || cell.type || 'empty';
        const floorColor = cell.floor?.config?.floorColor || TILE_COLORS[floorType] || '#0a0a0a';

        ctx.fillStyle = floorColor;
        ctx.fillRect(px, py, pixelSize, pixelSize);

        // Draw object on top if exists
        if (cell.object) {
          const objType = cell.object.type;
          const objColor = TILE_COLORS[objType];

          if (objColor) {
            // Draw object slightly smaller for visual distinction on larger tiles
            if (pixelSize > 3) {
              const inset = 1;
              ctx.fillStyle = objColor;
              ctx.fillRect(px + inset, py + inset, pixelSize - inset * 2, pixelSize - inset * 2);
            } else {
              ctx.fillStyle = objColor;
              ctx.fillRect(px, py, pixelSize, pixelSize);
            }
          }
        }
      }
    }

    // Add subtle border around content
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX, offsetY, renderedWidth, renderedHeight);

  }, [grid, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        borderRadius: 8,
        background: '#0a0a0a',
      }}
    />
  );
}
