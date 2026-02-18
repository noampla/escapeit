import { useRef, useEffect } from 'react';

function DropItemIcon({ theme, itemType, size = 28, itemState = {} }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    const rendered = theme?.renderInventoryItem?.(ctx, itemType, 0, 0, size, itemState);
    if (!rendered) {
      const emoji = theme?.getItemEmoji?.(itemType);
      if (emoji) {
        ctx.font = `${size * 0.7}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, size / 2, size / 2);
      }
    }
  }, [theme, itemType, size, itemState]);

  return <canvas ref={canvasRef} width={size} height={size} style={{ display: 'block' }} />;
}

export default function MobileDropModal({
  inventory,
  theme,
  themeId,
  onDrop,
  onClose,
  getItemLabel,
  isRTL,
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 550,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, rgba(30, 45, 30, 0.96), rgba(20, 35, 20, 0.96))',
          borderRadius: 16,
          padding: '20px 16px',
          width: 'calc(100vw - 48px)',
          maxWidth: 360,
          maxHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.8), 0 0 0 2px rgba(68, 170, 68, 0.4)',
        }}
      >
        <h3 style={{
          color: '#a8f0a8',
          margin: '0 0 4px 0',
          fontSize: 18,
          fontWeight: 800,
          textAlign: 'center',
          direction: isRTL ? 'rtl' : 'ltr',
        }}>
          Drop Item
        </h3>
        <div style={{
          color: '#88cc88',
          fontSize: 11,
          textAlign: 'center',
          marginBottom: 12,
          direction: isRTL ? 'rtl' : 'ltr',
        }}>
          Tap an item to drop it
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          {inventory.length === 0 ? (
            <div style={{ color: '#a8e8a8', fontSize: 14, padding: 20, textAlign: 'center' }}>
              Inventory empty
            </div>
          ) : (
            inventory.map((item, idx) => {
              const isWearable = theme?.isWearable?.(item.itemType);
              const themeLabel = theme?.getItemLabel?.(item.itemType, item) || item.itemType;
              const itemLabel = getItemLabel ? getItemLabel(themeId, item.itemType, themeLabel) : themeLabel;

              return (
                <button
                  key={idx}
                  onClick={() => onDrop(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '14px 14px',
                    background: isWearable ? 'rgba(34, 68, 120, 0.5)' : 'rgba(40, 55, 40, 0.6)',
                    border: isWearable
                      ? '1px solid rgba(100, 140, 220, 0.4)'
                      : '1px solid rgba(68, 170, 68, 0.3)',
                    borderRadius: 10,
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: 52,
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <DropItemIcon theme={theme} itemType={item.itemType} size={28} itemState={item} />
                  <span style={{ flex: 1, direction: isRTL ? 'rtl' : 'ltr' }}>
                    {itemLabel}
                  </span>
                  {isWearable && (
                    <span style={{ fontSize: 9, color: '#a8c8ff', textTransform: 'uppercase' }}>
                      Wear
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 12,
            width: '100%',
            padding: '12px',
            background: 'rgba(30, 40, 30, 0.6)',
            border: '1px solid rgba(68, 170, 68, 0.3)',
            borderRadius: 10,
            color: '#c8e6c8',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
