import React, { useState, useRef, useEffect, useCallback } from 'react';
import './CanvasEditorModal.css';

const DEFAULT_PALETTE = ['#222222', '#ffffff', '#cc4444', '#4444cc'];

export default function CanvasEditorModal({
  width = 16,
  height = 16,
  palette = DEFAULT_PALETTE,
  initialData = null,
  onSave,
  onCancel
}) {
  const canvasRef = useRef(null);
  const [selectedColor, setSelectedColor] = useState(palette[0]);
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
  const drawPixel = useCallback((x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;

    setPixels(prev => {
      const newPixels = [...prev];
      newPixels[y * width + x] = selectedColor === 'eraser' ? null : selectedColor;
      return newPixels;
    });
  }, [selectedColor, width, height]);

  // Mouse event handlers
  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const { x, y } = getPixelCoords(e);
    drawPixel(x, y);
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
          {/* Color palette */}
          <div className="canvas-editor-palette">
            {palette.map(color => (
              <button
                key={color}
                className={`palette-color ${selectedColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
                title={color}
              />
            ))}
            <button
              className={`palette-color eraser ${selectedColor === 'eraser' ? 'selected' : ''}`}
              onClick={() => setSelectedColor('eraser')}
              title="Eraser"
            >
              <span style={{ fontSize: '14px' }}>&#x2715;</span>
            </button>
          </div>

          {/* Canvas */}
          <div className="canvas-editor-canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: 'crosshair' }}
            />
          </div>

          <div className="canvas-editor-info">
            {width}x{height} pixels
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
