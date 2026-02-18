import { useRef, useEffect, useCallback } from 'react';

const DPAD_BTN_SIZE = 56;
const ACTION_BTN_SIZE = 52;

export default function MobileJoystick({
  keysDown,
  keyPressOrder,
  onPickup,
  onInteract,
  onWear,
  onInteractRelease,
  interactionState,
  isRTL,
}) {
  const dpadRef = useRef(null);
  const actionAreaRef = useRef(null);
  const activeTouches = useRef(new Map()); // touchId -> buttonName

  const injectKey = useCallback((key) => {
    keysDown.current.add(key);
    keyPressOrder.current = keyPressOrder.current.filter(k => k !== key);
    keyPressOrder.current.push(key);
  }, [keysDown, keyPressOrder]);

  const releaseKey = useCallback((key) => {
    keysDown.current.delete(key);
    keyPressOrder.current = keyPressOrder.current.filter(k => k !== key);
  }, [keysDown, keyPressOrder]);

  // Use native event listeners for { passive: false }
  useEffect(() => {
    const dpad = dpadRef.current;
    const actionArea = actionAreaRef.current;
    if (!dpad || !actionArea) return;

    const getButtonFromTouch = (touch, container) => {
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!el) return null;
      return el.closest('[data-btn]')?.dataset.btn || null;
    };

    const keyMap = {
      up: 'arrowup',
      down: 'arrowdown',
      left: 'arrowleft',
      right: 'arrowright',
    };

    const handleTouchStart = (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        const btn = getButtonFromTouch(touch);
        if (!btn) continue;
        activeTouches.current.set(touch.identifier, btn);

        if (keyMap[btn]) {
          injectKey(keyMap[btn]);
        } else if (btn === 'interact') {
          onInteract();
        } else if (btn === 'pickup') {
          onPickup();
        } else if (btn === 'wear') {
          onWear();
        }
      }
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        const btn = activeTouches.current.get(touch.identifier);
        activeTouches.current.delete(touch.identifier);
        if (!btn) continue;

        if (keyMap[btn]) {
          releaseKey(keyMap[btn]);
        } else if (btn === 'interact') {
          onInteractRelease();
        }
      }
    };

    const handleTouchCancel = (e) => {
      for (const touch of e.changedTouches) {
        const btn = activeTouches.current.get(touch.identifier);
        activeTouches.current.delete(touch.identifier);
        if (!btn) continue;
        if (keyMap[btn]) {
          releaseKey(keyMap[btn]);
        } else if (btn === 'interact') {
          onInteractRelease();
        }
      }
    };

    const opts = { passive: false };
    dpad.addEventListener('touchstart', handleTouchStart, opts);
    dpad.addEventListener('touchend', handleTouchEnd, opts);
    dpad.addEventListener('touchcancel', handleTouchCancel, opts);
    actionArea.addEventListener('touchstart', handleTouchStart, opts);
    actionArea.addEventListener('touchend', handleTouchEnd, opts);
    actionArea.addEventListener('touchcancel', handleTouchCancel, opts);

    return () => {
      dpad.removeEventListener('touchstart', handleTouchStart, opts);
      dpad.removeEventListener('touchend', handleTouchEnd, opts);
      dpad.removeEventListener('touchcancel', handleTouchCancel, opts);
      actionArea.removeEventListener('touchstart', handleTouchStart, opts);
      actionArea.removeEventListener('touchend', handleTouchEnd, opts);
      actionArea.removeEventListener('touchcancel', handleTouchCancel, opts);
    };
  }, [injectKey, releaseKey, onPickup, onInteract, onWear, onInteractRelease]);

  const dpadBtnStyle = {
    width: DPAD_BTN_SIZE,
    height: DPAD_BTN_SIZE,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(40, 40, 40, 0.75)',
    border: '2px solid rgba(255, 255, 255, 0.25)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 22,
    userSelect: 'none',
    WebkitUserSelect: 'none',
    cursor: 'pointer',
  };

  const actionBtnBase = {
    width: ACTION_BTN_SIZE,
    height: ACTION_BTN_SIZE,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    border: '2px solid',
    fontSize: 11,
    fontWeight: 700,
    color: '#fff',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flexDirection: 'column',
    gap: 1,
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 200,
      pointerEvents: 'none',
      zIndex: 500,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      padding: '0 16px 24px',
    }}>
      {/* D-pad */}
      <div ref={dpadRef} style={{
        pointerEvents: 'auto',
        display: 'grid',
        gridTemplateColumns: `${DPAD_BTN_SIZE}px ${DPAD_BTN_SIZE}px ${DPAD_BTN_SIZE}px`,
        gridTemplateRows: `${DPAD_BTN_SIZE}px ${DPAD_BTN_SIZE}px ${DPAD_BTN_SIZE}px`,
        gap: 4,
        opacity: 0.75,
      }}>
        {/* Row 1: empty, up, empty */}
        <div />
        <div data-btn="up" style={dpadBtnStyle}>
          <span style={{ fontSize: 26 }}>&#9650;</span>
        </div>
        <div />
        {/* Row 2: left, center, right */}
        <div data-btn="left" style={dpadBtnStyle}>
          <span style={{ fontSize: 26 }}>&#9664;</span>
        </div>
        <div style={{
          width: DPAD_BTN_SIZE,
          height: DPAD_BTN_SIZE,
          background: 'rgba(30, 30, 30, 0.5)',
          borderRadius: 10,
        }} />
        <div data-btn="right" style={dpadBtnStyle}>
          <span style={{ fontSize: 26 }}>&#9654;</span>
        </div>
        {/* Row 3: empty, down, empty */}
        <div />
        <div data-btn="down" style={dpadBtnStyle}>
          <span style={{ fontSize: 26 }}>&#9660;</span>
        </div>
        <div />
      </div>

      {/* Action buttons */}
      <div ref={actionAreaRef} style={{
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        opacity: 0.75,
      }}>
        {/* Top row: Interact */}
        <div data-btn="interact" style={{
          ...actionBtnBase,
          background: interactionState
            ? 'rgba(68, 136, 255, 0.9)'
            : 'rgba(68, 136, 255, 0.65)',
          borderColor: 'rgba(100, 170, 255, 0.6)',
          boxShadow: interactionState
            ? '0 0 16px rgba(68, 136, 255, 0.6)'
            : 'none',
        }}>
          <span style={{ fontSize: 16 }}>E</span>
          <span style={{ fontSize: 9 }}>ACT</span>
        </div>
        {/* Bottom row: Pickup + Wear */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div data-btn="pickup" style={{
            ...actionBtnBase,
            background: 'rgba(68, 204, 68, 0.65)',
            borderColor: 'rgba(100, 230, 100, 0.6)',
          }}>
            <span style={{ fontSize: 16 }}>F</span>
            <span style={{ fontSize: 9 }}>PICK</span>
          </div>
          <div data-btn="wear" style={{
            ...actionBtnBase,
            background: 'rgba(170, 68, 255, 0.65)',
            borderColor: 'rgba(200, 120, 255, 0.6)',
          }}>
            <span style={{ fontSize: 16 }}>T</span>
            <span style={{ fontSize: 9 }}>WEAR</span>
          </div>
        </div>
      </div>
    </div>
  );
}
