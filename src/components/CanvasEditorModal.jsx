import React, { useState, useRef, useEffect, useCallback } from 'react';
import './CanvasEditorModal.css';

// Rainbow palette with more colors
// null represents transparent (eraser color)
const DEFAULT_PALETTE = [
  // Transparent (first for easy access)
  null,
  // Grayscale
  '#000000', '#444444', '#888888', '#cccccc', '#ffffff',
  // Rainbow
  '#ff0000', '#ff8800', '#ffff00', '#88ff00', '#00ff00',
  '#00ff88', '#00ffff', '#0088ff', '#0000ff', '#8800ff',
  '#ff00ff', '#ff0088',
  // Additional useful colors
  '#884400', '#ff8888', '#88ff88', '#8888ff', '#ffff88',
];

export default function CanvasEditorModal({
  width = 16,
  height = 16,
  palette = DEFAULT_PALETTE,
  initialData = null,
  onSave,
  onCancel
}) {
  const canvasRef = useRef(null);
  // Default to first non-null color (black)
  const [selectedColor, setSelectedColor] = useState(palette.find(c => c !== null) || '#000000');
  const [selectedTool, setSelectedTool] = useState('pencil'); // 'pencil', 'fill', 'eraser'
  const [isDrawing, setIsDrawing] = useState(false);
  const [pixels, setPixels] = useState(() => Array(width * height).fill(null));

  const pixelSize = 20; // Display size per pixel
  const canvasWidth = width * pixelSize;
  const canvasHeight = height * pixelSize;

  // Load initial data if provided
  useEffect(() => {
    if (initialData) {
      const img = new Image();
      img.onload = () => {
        // Create a temp canvas to read pixel data
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0, width, height);

        const imageData = tempCtx.getImageData(0, 0, width, height);
        const newPixels = [];

        for (let i = 0; i < width * height; i++) {
          const r = imageData.data[i * 4];
          const g = imageData.data[i * 4 + 1];
          const b = imageData.data[i * 4 + 2];
          const a = imageData.data[i * 4 + 3];

          if (a > 0) {
            // Convert to hex color
            newPixels.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
          } else {
            newPixels.push(null);
          }
        }

        setPixels(newPixels);
      };
      img.src = initialData;
    }
  }, [initialData, width, height]);

  // Render canvas whenever pixels change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Draw each cell
    pixels.forEach((color, i) => {
      const x = i % width;
      const y = Math.floor(i / width);
      const px = x * pixelSize;
      const py = y * pixelSize;

      if (color) {
        // Filled pixel
        ctx.fillStyle = color;
        ctx.fillRect(px, py, pixelSize, pixelSize);
      } else {
        // Empty pixel - draw checkerboard pattern to distinguish from black
        const checkSize = pixelSize / 2;
        for (let cy = 0; cy < 2; cy++) {
          for (let cx = 0; cx < 2; cx++) {
            const isLight = (cx + cy) % 2 === 0;
            ctx.fillStyle = isLight ? '#4a4a4a' : '#3a3a3a';
            ctx.fillRect(px + cx * checkSize, py + cy * checkSize, checkSize, checkSize);
          }
        }
      }
    });

    // Draw grid lines on top
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * pixelSize, 0);
      ctx.lineTo(x * pixelSize, canvasHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * pixelSize);
      ctx.lineTo(canvasWidth, y * pixelSize);
      ctx.stroke();
    }
  }, [pixels, width, height, canvasWidth, canvasHeight, pixelSize]);

  // Get pixel coordinates from mouse event
  const getPixelCoords = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);
    return { x, y };
  }, [pixelSize]);

  // Draw a single pixel
  const drawPixel = useCallback((x, y, erase = false) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;

    setPixels(prev => {
      const newPixels = [...prev];
      if (erase || selectedTool === 'eraser' || selectedColor === null) {
        newPixels[y * width + x] = null;
      } else {
        newPixels[y * width + x] = selectedColor;
      }
      return newPixels;
    });
  }, [selectedColor, selectedTool, width, height]);

  // Flood fill algorithm
  const floodFill = useCallback((startX, startY) => {
    if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;

    setPixels(prev => {
      const newPixels = [...prev];
      const targetColor = newPixels[startY * width + startX];
      const fillColor = selectedTool === 'eraser' ? null : selectedColor;

      // Don't fill if target is same as fill color
      if (targetColor === fillColor) return prev;

      const stack = [[startX, startY]];
      const visited = new Set();

      while (stack.length > 0) {
        const [x, y] = stack.pop();
        const key = `${x},${y}`;

        if (visited.has(key)) continue;
        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        const currentColor = newPixels[y * width + x];
        if (currentColor !== targetColor) continue;

        visited.add(key);
        newPixels[y * width + x] = fillColor;

        // Add neighbors to stack
        stack.push([x + 1, y]);
        stack.push([x - 1, y]);
        stack.push([x, y + 1]);
        stack.push([x, y - 1]);
      }

      return newPixels;
    });
  }, [selectedColor, selectedTool, width, height]);

  // Mouse event handlers
  const handleMouseDown = (e) => {
    // Prevent context menu on right click
    if (e.button === 2) return;

    const { x, y } = getPixelCoords(e);

    if (selectedTool === 'fill') {
      floodFill(x, y);
    } else {
      setIsDrawing(true);
      drawPixel(x, y);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const { x, y } = getPixelCoords(e);
    drawPixel(x, y);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleMouseLeave = () => {
    setIsDrawing(false);
  };

  // Right-click to erase
  const handleContextMenu = (e) => {
    e.preventDefault();
    const { x, y } = getPixelCoords(e);

    if (selectedTool === 'fill') {
      // Fill with eraser (null) on right-click when fill tool is selected
      setPixels(prev => {
        const newPixels = [...prev];
        const targetColor = newPixels[y * width + x];

        if (targetColor === null) return prev; // Already empty

        const stack = [[x, y]];
        const visited = new Set();

        while (stack.length > 0) {
          const [fx, fy] = stack.pop();
          const key = `${fx},${fy}`;

          if (visited.has(key)) continue;
          if (fx < 0 || fx >= width || fy < 0 || fy >= height) continue;

          const currentColor = newPixels[fy * width + fx];
          if (currentColor !== targetColor) continue;

          visited.add(key);
          newPixels[fy * width + fx] = null;

          stack.push([fx + 1, fy]);
          stack.push([fx - 1, fy]);
          stack.push([fx, fy + 1]);
          stack.push([fx, fy - 1]);
        }

        return newPixels;
      });
    } else {
      // Regular erase on right-click
      drawPixel(x, y, true);
    }
  };

  // Right-click drag to erase
  const handleRightMouseDown = (e) => {
    if (e.button === 2) {
      e.preventDefault();
      if (selectedTool !== 'fill') {
        setIsDrawing(true);
        const { x, y } = getPixelCoords(e);
        drawPixel(x, y, true);
      }
    }
  };

  const handleRightMouseMove = (e) => {
    if (!isDrawing || e.buttons !== 2) return;
    if (selectedTool === 'fill') return;
    const { x, y } = getPixelCoords(e);
    drawPixel(x, y, true);
  };

  // Export to base64 PNG
  const handleSave = () => {
    // Check if canvas is empty
    const hasContent = pixels.some(p => p !== null);
    if (!hasContent) {
      onSave(null);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Draw pixels at 1:1 scale
    pixels.forEach((color, i) => {
      if (color) {
        const x = i % width;
        const y = Math.floor(i / width);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    });

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  // Clear canvas
  const handleClear = () => {
    setPixels(Array(width * height).fill(null));
  };

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  // Get cursor based on tool
  const getCursor = () => {
    if (selectedTool === 'fill') return 'cell';
    if (selectedTool === 'eraser') return 'not-allowed';
    return 'crosshair';
  };

  return (
    <div className="canvas-editor-overlay" onClick={onCancel}>
      <div className="canvas-editor-modal" onClick={e => e.stopPropagation()}>
        <div className="canvas-editor-header">
          <h2>Drawing Editor</h2>
          <button className="canvas-editor-close" onClick={onCancel} title="Close (ESC)">
            &times;
          </button>
        </div>

        <div className="canvas-editor-body">
          {/* Tools */}
          <div className="canvas-editor-tools">
            <button
              className={`tool-btn ${selectedTool === 'pencil' ? 'selected' : ''}`}
              onClick={() => setSelectedTool('pencil')}
              title="Pencil (draw)"
            >
              &#x270F;
            </button>
            <button
              className={`tool-btn ${selectedTool === 'fill' ? 'selected' : ''}`}
              onClick={() => setSelectedTool('fill')}
              title="Fill bucket"
            >
              &#x1F4A7;
            </button>
            <button
              className={`tool-btn ${selectedTool === 'eraser' ? 'selected' : ''}`}
              onClick={() => setSelectedTool('eraser')}
              title="Eraser"
            >
              &#x2715;
            </button>
          </div>

          {/* Color palette */}
          <div className="canvas-editor-palette">
            {palette.map((color, idx) => (
              <button
                key={`${color}-${idx}`}
                className={`palette-color ${selectedColor === color && selectedTool !== 'eraser' ? 'selected' : ''} ${color === null ? 'transparent-color' : ''}`}
                style={color !== null ? { backgroundColor: color } : {}}
                onClick={() => {
                  setSelectedColor(color);
                  if (selectedTool === 'eraser') setSelectedTool('pencil');
                }}
                title={color === null ? 'Transparent' : color}
              />
            ))}
          </div>

          {/* Canvas */}
          <div className="canvas-editor-canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              onMouseDown={(e) => {
                handleMouseDown(e);
                handleRightMouseDown(e);
              }}
              onMouseMove={(e) => {
                handleMouseMove(e);
                handleRightMouseMove(e);
              }}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onContextMenu={handleContextMenu}
              style={{ cursor: getCursor() }}
            />
          </div>

          <div className="canvas-editor-info">
            {width}x{height} pixels | Left: draw | Right: erase
          </div>
        </div>

        <div className="canvas-editor-footer">
          <button className="canvas-editor-btn secondary" onClick={handleClear}>
            Clear
          </button>
          <div className="canvas-editor-footer-right">
            <button className="canvas-editor-btn secondary" onClick={onCancel}>
              Cancel
            </button>
            <button className="canvas-editor-btn primary" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
