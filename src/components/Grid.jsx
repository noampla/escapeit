import { useRef, useEffect, useCallback, useState } from 'react';
import { TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';
import { getAllHazardZones } from '../engine/hazards';
import soundManager from '../engine/soundManager';

// Default emoji fallbacks (used if theme doesn't provide getTileEmoji)
const DEFAULT_TILE_EMOJIS = {
  tree: '🌲', water: '🌊', snow: '❄️', raft: '🛶',
  campfire: '🏕️', car: '🚗', friend: '👤', fire: '🔥', bear: '🐻',
  start: '🚪', exit: '🚐',
  // Item tiles
  'item-key': '🔑',
  'item-axe': '🪓',
  'item-bucket': '🪣',
  'item-rope': '🧵',
  'item-knife': '🔪',
  'item-sweater': '🧥',
  'item-wood': '🪵',
};

export default function Grid({ grid, onClick, onRightClick, onDrag, onRightDrag, onHoldStart, onHoldEnd, playerPos, playerDirection = 'down', showHazardZones, tick = 0, hazardZoneOverrides, showTooltips = false, revealedTiles, viewportBounds, interactionTarget = null, interactionProgress = 0, interactionProgressColor = null, theme, gameState = {}, onTileHover, enablePreview = false, pathTiles, allTilePaths, activationMarkers, activationPickMode, isBuilder = false }) {
  const canvasRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const isDragging = useRef(false);
  const isRightDragging = useRef(false);
  const holdStartTime = useRef(null);
  const holdStartPos = useRef(null);
  const lastHoverPos = useRef(null);
  const hoverTimerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const hasVoidTilesRef = useRef(false);

  // Calculate canvas dimensions based on viewport bounds
  const canvasWidth = viewportBounds
    ? (viewportBounds.maxX - viewportBounds.minX + 1) * TILE_SIZE
    : CANVAS_WIDTH;
  const canvasHeight = viewportBounds
    ? (viewportBounds.maxY - viewportBounds.minY + 1) * TILE_SIZE
    : CANVAS_HEIGHT;

  // Calculate offset for rendering
  const offsetX = viewportBounds ? viewportBounds.minX : 0;
  const offsetY = viewportBounds ? viewportBounds.minY : 0;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Fill with plain dark background (tiles will render on top)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Determine the range of tiles to render
    const startX = viewportBounds ? viewportBounds.minX : 0;
    const startY = viewportBounds ? viewportBounds.minY : 0;
    const endX = viewportBounds ? viewportBounds.maxX : grid[0].length - 1;
    const endY = viewportBounds ? viewportBounds.maxY : grid.length - 1;

    // Get dark zone tiles once (theme-agnostic)
    const darkZoneTiles = playerPos ? (theme?.getDarkZoneTiles?.(grid) || new Set()) : new Set();
    const playerInDarkZone = playerPos ? (theme?.isPlayerInDarkZone?.(playerPos, grid, gameState) || false) : false;
    const playerOnDarkTile = playerPos ? (theme?.isPlayerOnDarkTile?.(playerPos, grid, gameState) || false) : false;
    const hasLight = playerPos ? (theme?.hasLightInDarkZone?.(gameState) || false) : false;
    // Get tiles illuminated by dropped torches (these are always visible with objects)
    const torchLitTiles = theme?.getDroppedTorchLitTiles?.(grid) || new Set();

    // Calculate temporary visibility for dark zone (5 tiles: current + 4 cardinal)
    const darkZoneVisible = new Set();
    if (playerInDarkZone && playerPos) {
      darkZoneVisible.add(`${playerPos.x},${playerPos.y}`);
      darkZoneVisible.add(`${playerPos.x},${playerPos.y - 1}`);
      darkZoneVisible.add(`${playerPos.x},${playerPos.y + 1}`);
      darkZoneVisible.add(`${playerPos.x - 1},${playerPos.y}`);
      darkZoneVisible.add(`${playerPos.x + 1},${playerPos.y}`);
    }

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const key = `${x},${y}`;
        const isDarkZoneTile = darkZoneTiles.has(key);
        const px = (x - offsetX) * TILE_SIZE, py = (y - offsetY) * TILE_SIZE;

        // === DARK ZONE TILES - separate visibility system (theme-defined) ===
        if (isDarkZoneTile) {
          // Dark zone tiles are ONLY visible when player is inside the dark zone
          // With torch: tiles can be permanently revealed (stored in revealedTiles)
          // Without torch: only temporary 5-tile visibility
          // When outside: always black (even with torch)
          // Exception: tiles lit by dropped torches are always visible
          const isTorchLit = torchLitTiles.has(key);
          const isPermanentlyRevealed = playerInDarkZone && hasLight && revealedTiles?.has(key);
          const isTemporarilyVisible = playerInDarkZone && darkZoneVisible.has(key);

          if (!isPermanentlyRevealed && !isTemporarilyVisible && !isTorchLit) {
            // Not visible - black fog
            ctx.fillStyle = '#000';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            continue;
          }

          const cell = grid[y][x];
          const TILE_TYPES = theme?.getTileTypes() || {};
          const cx = px + TILE_SIZE / 2, cy = py + TILE_SIZE / 2;

          // Draw floor
          const floorDef = TILE_TYPES[cell.floor?.type] || TILE_TYPES.empty || { color: '#333' };
          ctx.fillStyle = cell.floor?.config?.floorColor || floorDef.color;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = '#2a3a2a';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
          const floorRendered = theme?.renderTile?.(ctx, cell.floor, cx, cy, TILE_SIZE);
          if (!floorRendered) {
            const floorEmoji = theme?.getTileEmoji?.(cell.floor?.type) || DEFAULT_TILE_EMOJIS[cell.floor?.type];
            if (floorEmoji) {
              ctx.font = '22px serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(floorEmoji, cx, cy);
            }
          }

          // If player has light OR tile is torch-lit: render objects, no dark overlay
          // Otherwise: no objects, apply dark overlay
          if (hasLight || isTorchLit) {
            // Render objects when lit
            if (cell.object) {
              if (cell.object.type.startsWith('item-')) {
                const itemType = cell.object.type.replace('item-', '');
                const rendered = theme?.renderItem?.(ctx, itemType, px, py, TILE_SIZE, cell.object.config);
                if (!rendered) {
                  const emoji = theme?.getItemEmoji?.(itemType) || DEFAULT_TILE_EMOJIS[cell.object.type];
                  if (emoji) {
                    ctx.font = '22px serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(emoji, cx, cy);
                  }
                }
              } else {
                const rendered = theme?.renderTile?.(ctx, cell.object, cx, cy, TILE_SIZE);
                if (!rendered) {
                  const emoji = theme?.getTileEmoji?.(cell.object.type) || DEFAULT_TILE_EMOJIS[cell.object.type];
                  if (emoji) {
                    ctx.font = '22px serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(emoji, cx, cy);
                  }
                }
              }
            }
            // No dark overlay when lit
          } else {
            // No objects rendered - darkness hides them
            // Apply dark overlay
            ctx.fillStyle = 'rgba(0, 0, 10, 0.6)';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          }
          continue;
        }

        // === REGULAR TILES - use revealedTiles fog of war ===
        if (revealedTiles && !revealedTiles.has(key)) {
          ctx.fillStyle = '#000';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          continue;
        }

        const cell = grid[y][x];
        const TILE_TYPES = theme?.getTileTypes() || {};
        const cx = px + TILE_SIZE / 2, cy = py + TILE_SIZE / 2;

        // === EMPTY/VOID TILES - cloud-like fog ===
        const floorType = cell.floor?.type;
        if (!floorType || floorType === 'empty' || floorType === 'void') {
          // In builder mode, just show static dark tile
          if (isBuilder) {
            ctx.fillStyle = '#1a1520';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = 'rgba(130, 100, 170, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
            continue;
          }

          hasVoidTilesRef.current = true;

          // Base: dark purple
          ctx.fillStyle = '#1a1520';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          // Smooth time for animation
          const time = Date.now() * 0.001;

          // Draw multiple soft cloud blobs
          ctx.globalAlpha = 1;

          // Cloud 1 - drifts slowly
          const c1x = cx + Math.sin(time * 0.8 + x) * 8;
          const c1y = cy + Math.cos(time * 0.6 + y) * 6;
          const grad1 = ctx.createRadialGradient(c1x, c1y, 0, c1x, c1y, 18);
          grad1.addColorStop(0, 'rgba(180, 150, 210, 0.35)');
          grad1.addColorStop(0.5, 'rgba(140, 110, 180, 0.2)');
          grad1.addColorStop(1, 'rgba(100, 80, 140, 0)');
          ctx.fillStyle = grad1;
          ctx.fillRect(px - 10, py - 10, TILE_SIZE + 20, TILE_SIZE + 20);

          // Cloud 2 - different speed/direction
          const c2x = cx + Math.cos(time * 1.1 + x * 0.7) * 10;
          const c2y = cy + Math.sin(time * 0.9 - y * 0.5) * 8;
          const grad2 = ctx.createRadialGradient(c2x, c2y, 0, c2x, c2y, 15);
          grad2.addColorStop(0, 'rgba(160, 130, 200, 0.3)');
          grad2.addColorStop(0.6, 'rgba(120, 95, 160, 0.15)');
          grad2.addColorStop(1, 'rgba(90, 70, 130, 0)');
          ctx.fillStyle = grad2;
          ctx.fillRect(px - 10, py - 10, TILE_SIZE + 20, TILE_SIZE + 20);

          // Cloud 3 - small wisp
          const c3x = cx + Math.sin(time * 1.5 - x * 0.3) * 6;
          const c3y = cy + Math.cos(time * 1.2 + y * 0.4) * 5;
          const grad3 = ctx.createRadialGradient(c3x, c3y, 0, c3x, c3y, 10);
          grad3.addColorStop(0, 'rgba(200, 170, 230, 0.25)');
          grad3.addColorStop(1, 'rgba(150, 120, 180, 0)');
          ctx.fillStyle = grad3;
          ctx.fillRect(px - 5, py - 5, TILE_SIZE + 10, TILE_SIZE + 10);

          // Subtle edge glow
          ctx.strokeStyle = 'rgba(130, 100, 170, 0.4)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

          continue;
        }

        // === LAYER 1: FLOOR ===
        const floorDef = TILE_TYPES[floorType] || TILE_TYPES.empty || { color: '#333' };

        // Draw floor background color (use config floorColor if available)
        ctx.fillStyle = cell.floor?.config?.floorColor || floorDef.color;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Draw grid border
        ctx.strokeStyle = '#2a3a2a';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

        // Draw floor custom rendering or emoji
        const floorRendered = theme?.renderTile?.(ctx, cell.floor, cx, cy, TILE_SIZE);
        if (!floorRendered) {
          const floorEmoji = theme?.getTileEmoji?.(cell.floor?.type) || DEFAULT_TILE_EMOJIS[cell.floor?.type];
          if (floorEmoji) {
            ctx.font = '22px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(floorEmoji, cx, cy);
          }
        }

        // === LAYER 2: OBJECT (if exists) ===
        if (cell.object) {
          // Items use special rendering
          if (cell.object.type.startsWith('item-')) {
            const itemType = cell.object.type.replace('item-', '');
            // Try theme's custom rendering first (pass top-left corner, not center)
            const rendered = theme?.renderItem?.(ctx, itemType, px, py, TILE_SIZE, cell.object.config);
            if (!rendered) {
              // Fallback to emoji (use center coordinates)
              const emoji = theme?.getItemEmoji?.(itemType) || DEFAULT_TILE_EMOJIS[cell.object.type];
              if (emoji) {
                ctx.font = '22px serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(emoji, cx, cy);
              }
            }
          } else {
            // Other objects (doors, hazards, etc)
            const rendered = theme?.renderTile?.(ctx, cell.object, cx, cy, TILE_SIZE);
            if (!rendered) {
              const emoji = theme?.getTileEmoji?.(cell.object.type) || DEFAULT_TILE_EMOJIS[cell.object.type];
              if (emoji) {
                ctx.font = '22px serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(emoji, cx, cy);
              }
            }
          }
        }
      }
    }

    // Hazard zones overlay
    if (showHazardZones) {
      // Use theme's hazard zones if available, otherwise fall back to engine's
      const themeZones = theme?.getAllHazardZones?.(grid) || [];
      const engineZones = getAllHazardZones(grid);
      const zones = hazardZoneOverrides || [...engineZones, ...themeZones];

      ctx.globalAlpha = 0.35;
      for (const z of zones) {
        // Skip zones outside viewport
        if (viewportBounds && (z.x < startX || z.x > endX || z.y < startY || z.y > endY)) continue;
        if (revealedTiles && !revealedTiles.has(`${z.x},${z.y}`)) continue;

        // Skip hazard zones in dark zone tiles that aren't visible
        // In dark zones, hazards are ONLY visible when player has light (torch) or tile is torch-lit
        const zKey = `${z.x},${z.y}`;
        if (darkZoneTiles.has(zKey)) {
          const zTorchLit = torchLitTiles.has(zKey);
          if (!hasLight && !zTorchLit) continue; // No hazard indicators without light
          const zVisible = zTorchLit || (playerInDarkZone && (
            revealedTiles?.has(zKey) || darkZoneVisible.has(zKey)
          ));
          if (!zVisible) continue;
        }

        const zpx = (z.x - offsetX) * TILE_SIZE, zpy = (z.y - offsetY) * TILE_SIZE;
        ctx.fillStyle = z.renderColor || '#ff4400';
        ctx.fillRect(zpx, zpy, TILE_SIZE, TILE_SIZE);

        // Add border for better visibility
        ctx.strokeStyle = z.renderColor || '#ff4400';
        ctx.lineWidth = 2;
        ctx.strokeRect(zpx + 1, zpy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }
      ctx.globalAlpha = 1;
    }

    // All gate paths overlay (always visible in builder with reduced opacity)
    if (allTilePaths && allTilePaths.length > 0) {
      allTilePaths.forEach((gatePath) => {
        const tiles = gatePath.tiles || [];
        tiles.forEach((tile, idx) => {
          const px = (tile.x - offsetX) * TILE_SIZE;
          const py = (tile.y - offsetY) * TILE_SIZE;

          // Skip if out of viewport bounds
          if (viewportBounds) {
            if (tile.x < viewportBounds.minX || tile.x > viewportBounds.maxX ||
                tile.y < viewportBounds.minY || tile.y > viewportBounds.maxY) {
              return;
            }
          }

          // Highlight tile with reduced opacity
          ctx.fillStyle = 'rgba(100, 150, 255, 0.15)';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          // Subtle border
          ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);

          // Path number with reduced opacity
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((idx + 1).toString(), px + TILE_SIZE / 2, py + TILE_SIZE / 2);
        });
      });
    }

    // Path tiles overlay (for path editing mode)
    if (pathTiles && pathTiles.length > 0) {
      pathTiles.forEach((tile, idx) => {
        const px = (tile.x - offsetX) * TILE_SIZE;
        const py = (tile.y - offsetY) * TILE_SIZE;

        // Skip if out of viewport bounds
        if (viewportBounds) {
          if (tile.x < viewportBounds.minX || tile.x > viewportBounds.maxX ||
              tile.y < viewportBounds.minY || tile.y > viewportBounds.maxY) {
            return;
          }
        }

        // Highlight tile
        ctx.fillStyle = 'rgba(100, 150, 255, 0.4)';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Border
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.9)';
        ctx.lineWidth = 3;
        ctx.strokeRect(px + 1.5, py + 1.5, TILE_SIZE - 3, TILE_SIZE - 3);

        // Path number
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((idx + 1).toString(), px + TILE_SIZE / 2, py + TILE_SIZE / 2);

        // Draw connection line to next tile
        if (idx < pathTiles.length - 1) {
          const nextTile = pathTiles[idx + 1];
          const nx = (nextTile.x - offsetX) * TILE_SIZE;
          const ny = (nextTile.y - offsetY) * TILE_SIZE;

          ctx.strokeStyle = 'rgba(100, 150, 255, 0.6)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(px + TILE_SIZE / 2, py + TILE_SIZE / 2);
          ctx.lineTo(nx + TILE_SIZE / 2, ny + TILE_SIZE / 2);
          ctx.stroke();
        }
      });
    }

    // Activation markers overlay (for showing requirement positions)
    if (activationMarkers && activationMarkers.length > 0) {
      activationMarkers.forEach((marker) => {
        const px = (marker.x - offsetX) * TILE_SIZE;
        const py = (marker.y - offsetY) * TILE_SIZE;

        // Skip if out of viewport bounds
        if (viewportBounds) {
          if (marker.x < viewportBounds.minX || marker.x > viewportBounds.maxX ||
              marker.y < viewportBounds.minY || marker.y > viewportBounds.maxY) {
            return;
          }
        }

        // Highlight tile with orange/gold color
        ctx.fillStyle = 'rgba(255, 180, 50, 0.35)';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Border
        ctx.strokeStyle = 'rgba(255, 180, 50, 0.9)';
        ctx.lineWidth = 3;
        ctx.strokeRect(px + 1.5, py + 1.5, TILE_SIZE - 3, TILE_SIZE - 3);

        // Show number if order matters, otherwise show a marker dot
        if (marker.showNumbers) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(marker.index.toString(), px + TILE_SIZE / 2, py + TILE_SIZE / 2);
        } else {
          // Draw a small diamond marker
          ctx.fillStyle = 'rgba(255, 220, 100, 0.9)';
          ctx.beginPath();
          const cx = px + TILE_SIZE / 2;
          const cy = py + TILE_SIZE / 2;
          const s = 8;
          ctx.moveTo(cx, cy - s);
          ctx.lineTo(cx + s, cy);
          ctx.lineTo(cx, cy + s);
          ctx.lineTo(cx - s, cy);
          ctx.closePath();
          ctx.fill();
        }

        // Show itemId label at bottom
        if (marker.itemId) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(px + 2, py + TILE_SIZE - 14, TILE_SIZE - 4, 12);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = '9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const label = marker.itemId.length > 8 ? marker.itemId.slice(0, 7) + '…' : marker.itemId;
          ctx.fillText(label, px + TILE_SIZE / 2, py + TILE_SIZE - 8);
        }
      });
    }

    // Activation pick mode hint (highlight all floor tiles when picking)
    if (activationPickMode) {
      ctx.fillStyle = 'rgba(100, 200, 255, 0.1)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Interaction progress overlay on target tile
    if (interactionTarget && interactionProgress > 0) {
      const itx = (interactionTarget.x - offsetX) * TILE_SIZE;
      const ity = (interactionTarget.y - offsetY) * TILE_SIZE;

      // Use custom color or default green
      const progressColor = interactionProgressColor || '#44ff44';
      // Parse color for overlay (create semi-transparent version)
      const overlayColor = interactionProgressColor
        ? `${interactionProgressColor}4d` // Add ~30% alpha
        : 'rgba(68, 170, 68, 0.3)';
      const borderColor = interactionProgressColor
        ? `${interactionProgressColor}cc` // Add ~80% alpha
        : 'rgba(68, 170, 68, 0.8)';

      // Semi-transparent overlay
      ctx.fillStyle = overlayColor;
      ctx.fillRect(itx, ity, TILE_SIZE, TILE_SIZE);

      // Progress bar at bottom of tile
      const barHeight = 6;
      const barY = ity + TILE_SIZE - barHeight - 2;
      const barX = itx + 2;
      const barWidth = TILE_SIZE - 4;

      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Progress fill
      ctx.fillStyle = progressColor;
      ctx.fillRect(barX, barY, barWidth * interactionProgress, barHeight);

      // Border
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    // Player
    if (playerPos) {
      const ppx = (playerPos.x - offsetX) * TILE_SIZE, ppy = (playerPos.y - offsetY) * TILE_SIZE;
      const centerX = ppx + TILE_SIZE / 2;
      const centerY = ppy + TILE_SIZE / 2;

      // Try theme-specific player rendering first
      const themeRendered = theme?.renderPlayer?.(ctx, centerX, centerY, TILE_SIZE, playerDirection, gameState);

      if (!themeRendered) {
        // Default player rendering (emoji)
        ctx.font = '26px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧑', centerX, centerY);
      }

      // Direction indicator (always show for both default and theme-rendered players)
      const dirOffsets = {
        up: { x: 0, y: -8 },
        down: { x: 0, y: 8 },
        left: { x: -8, y: 0 },
        right: { x: 8, y: 0 },
      };
      const offset = dirOffsets[playerDirection] || dirOffsets.down;
      const arrowX = centerX + offset.x;
      const arrowY = centerY + offset.y;

      ctx.fillStyle = 'rgba(255, 255, 100, 0.9)';
      ctx.beginPath();
      if (playerDirection === 'up') {
        ctx.moveTo(arrowX, arrowY - 3);
        ctx.lineTo(arrowX - 3, arrowY + 2);
        ctx.lineTo(arrowX + 3, arrowY + 2);
      } else if (playerDirection === 'down') {
        ctx.moveTo(arrowX, arrowY + 3);
        ctx.lineTo(arrowX - 3, arrowY - 2);
        ctx.lineTo(arrowX + 3, arrowY - 2);
      } else if (playerDirection === 'left') {
        ctx.moveTo(arrowX - 3, arrowY);
        ctx.lineTo(arrowX + 2, arrowY - 3);
        ctx.lineTo(arrowX + 2, arrowY + 3);
      } else if (playerDirection === 'right') {
        ctx.moveTo(arrowX + 3, arrowY);
        ctx.lineTo(arrowX - 2, arrowY - 3);
        ctx.lineTo(arrowX - 2, arrowY + 3);
      }
      ctx.closePath();
      ctx.fill();

      // Arrow outline
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Dark overlay on player when on actual dark tile (cave interior, not entry)
      if (playerOnDarkTile && !hasLight) {
        ctx.fillStyle = 'rgba(0, 0, 10, 0.6)';
        ctx.fillRect(ppx, ppy, TILE_SIZE, TILE_SIZE);
      }
    }

  }, [grid, playerPos, playerDirection, showHazardZones, tick, hazardZoneOverrides, revealedTiles, viewportBounds, canvasWidth, canvasHeight, offsetX, offsetY, interactionTarget, interactionProgress, interactionProgressColor, theme, gameState, pathTiles, allTilePaths, activationMarkers, activationPickMode]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Smooth 60fps animation loop for void tiles
  useEffect(() => {
    let running = true;

    const animate = () => {
      if (!running) return;
      if (hasVoidTilesRef.current) {
        draw();
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      running = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draw]);

  const getTileAt = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const localX = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const localY = Math.floor((e.clientY - rect.top) / TILE_SIZE);
    const x = localX + offsetX;
    const y = localY + offsetY;
    if (x >= 0 && x < grid[0].length && y >= 0 && y < grid.length) return { x, y };
    return null;
  };

  const handleMouseDown = (e) => {
    if (e.button === 0) { // Left-click
      const pos = getTileAt(e);
      if (pos) {
        // Start hold timer for interactions
        if (onHoldStart) {
          holdStartTime.current = Date.now();
          holdStartPos.current = pos;
          onHoldStart(pos.x, pos.y);
        }
        if (onClick) onClick(pos.x, pos.y, e);
      }
      isDragging.current = true;
    } else if (e.button === 2) { // Right-click
      e.preventDefault();
      const pos = getTileAt(e);
      if (pos) {
        if (onRightClick) onRightClick(pos.x, pos.y);
        isRightDragging.current = true;
      }
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging.current && onDrag) {
      const pos = getTileAt(e);
      if (pos) onDrag(pos.x, pos.y, e);
    }
    if (isRightDragging.current && onRightDrag) {
      const pos = getTileAt(e);
      if (pos) onRightDrag(pos.x, pos.y, e);
    }

    const pos = getTileAt(e);

    // Handle tile preview on hover (with debounce)
    if (enablePreview && onTileHover && pos) {
      const posKey = `${pos.x},${pos.y}`;
      if (lastHoverPos.current !== posKey) {
        lastHoverPos.current = posKey;
        // Clear previous timer
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current);
        }
        // Debounce hover to avoid rapid firing
        hoverTimerRef.current = setTimeout(() => {
          const cell = grid[pos.y]?.[pos.x];
          if (cell) {
            const tileType = cell.object?.type || cell.floor?.type;
            // Only show preview for meaningful tiles
            if (tileType && tileType !== 'empty' && tileType !== 'ground' && tileType !== 'floor') {
              soundManager.play('hover', { volume: 0.4 });
              onTileHover(cell, pos);
            } else {
              onTileHover(null, null);
            }
          }
        }, 150); // 150ms debounce
      }
    }

    if (!showTooltips) { setTooltip(null); return; }
    if (!pos) { setTooltip(null); return; }
    const cell = grid[pos.y][pos.x];
    const TILE_TYPES = theme?.getTileTypes() || {};

    // Prioritize object tooltip over floor tooltip
    const tileType = cell.object ? cell.object.type : cell.floor?.type;
    const def = TILE_TYPES[tileType];

    if (def && def.tooltip && tileType !== 'empty' && tileType !== 'ground') {
      const rect = canvasRef.current.getBoundingClientRect();
      setTooltip({
        text: `${def.label}: ${def.tooltip}`,
        x: e.clientX - rect.left + 10,
        y: e.clientY - rect.top - 10,
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseUp = (e) => {
    // Check which button was released
    if (e.button === 0) {
      // Left mouse button released
      if (onHoldEnd && holdStartPos.current) {
        onHoldEnd();
      }
      holdStartTime.current = null;
      holdStartPos.current = null;
      isDragging.current = false;
    } else if (e.button === 2) {
      // Right mouse button released
      isRightDragging.current = false;
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault(); // Prevent context menu from showing
  };

  const handleMouseLeave = () => {
    // Cancel hold on mouse leave
    if (onHoldEnd && holdStartPos.current) {
      onHoldEnd();
    }
    holdStartTime.current = null;
    holdStartPos.current = null;
    setTooltip(null);
    isDragging.current = false;
    isRightDragging.current = false;
    // Clear hover preview
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    lastHoverPos.current = null;
    if (onTileHover) {
      onTileHover(null, null);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onMouseLeave={handleMouseLeave}
        style={{
          border: 'none',
          borderRadius: 4,
          cursor: 'crosshair',
          display: 'block',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
        tabIndex={-1}
      />
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: tooltip.x,
          top: tooltip.y,
          background: 'linear-gradient(145deg, rgba(20, 30, 20, 0.98) 0%, rgba(10, 20, 10, 0.98) 100%)',
          color: '#e8f8e8',
          padding: '8px 12px',
          borderRadius: 8,
          fontSize: 12,
          pointerEvents: 'none',
          zIndex: 50,
          maxWidth: 240,
          whiteSpace: 'pre-wrap',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(68, 170, 68, 0.3)',
          fontWeight: '500',
          backdropFilter: 'blur(8px)',
        }}>
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
