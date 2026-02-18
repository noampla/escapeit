import { useRef, useEffect, useCallback, useState } from 'react';

const JOYSTICK_RADIUS = 70;
const THUMB_RADIUS = 28;
const DEAD_ZONE = 14;
const DPAD_BTN_SIZE = 62;
const ACTION_BTN_SIZE = 58;

export default function MobileJoystick({
  keysDown,
  keyPressOrder,
  onPickup,
  onInteract,
  onWear,
  onInteractRelease,
  interactionState,
  isRTL,
  mode, // 'joystick' | 'dpad'
  onToggleMode,
}) {
  const movementRef = useRef(null);
  const actionAreaRef = useRef(null);
  const activeTouches = useRef(new Map());

  // Joystick-specific state
  const joystickTouchId = useRef(null);
  const joystickCenter = useRef({ x: 0, y: 0 });
  const currentDirection = useRef(null);
  const [thumbOffset, setThumbOffset] = useState({ x: 0, y: 0 });

  const directionKeys = {
    up: 'arrowup',
    down: 'arrowdown',
    left: 'arrowleft',
    right: 'arrowright',
  };

  const injectKey = useCallback((key) => {
    keysDown.current.add(key);
    keyPressOrder.current = keyPressOrder.current.filter(k => k !== key);
    keyPressOrder.current.push(key);
  }, [keysDown, keyPressOrder]);

  const releaseKey = useCallback((key) => {
    keysDown.current.delete(key);
    keyPressOrder.current = keyPressOrder.current.filter(k => k !== key);
  }, [keysDown, keyPressOrder]);

  const releaseAllDirections = useCallback(() => {
    Object.values(directionKeys).forEach(key => releaseKey(key));
  }, [releaseKey]);

  const setDirection = useCallback((newDir) => {
    const prev = currentDirection.current;
    if (prev === newDir) return;
    if (prev && directionKeys[prev]) releaseKey(directionKeys[prev]);
    if (newDir && directionKeys[newDir]) injectKey(directionKeys[newDir]);
    currentDirection.current = newDir;
  }, [injectKey, releaseKey]);

  const angleToDirection = (dx, dy) => {
    const deg = Math.atan2(dy, dx) * (180 / Math.PI);
    if (deg >= -45 && deg < 45) return 'right';
    if (deg >= 45 && deg < 135) return 'down';
    if (deg >= -135 && deg < -45) return 'up';
    return 'left';
  };

  // Analog joystick touch handling
  useEffect(() => {
    if (mode !== 'joystick') return;
    const el = movementRef.current;
    if (!el) return;

    const handleStart = (e) => {
      e.preventDefault();
      if (joystickTouchId.current !== null) return;
      const touch = e.changedTouches[0];
      joystickTouchId.current = touch.identifier;
      const rect = el.getBoundingClientRect();
      joystickCenter.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const dx = touch.clientX - joystickCenter.current.x;
      const dy = touch.clientY - joystickCenter.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > DEAD_ZONE) {
        const clamped = Math.min(dist, JOYSTICK_RADIUS - THUMB_RADIUS);
        setThumbOffset({ x: dx * (clamped / dist), y: dy * (clamped / dist) });
        setDirection(angleToDirection(dx, dy));
      } else {
        setThumbOffset({ x: 0, y: 0 });
      }
    };

    const handleMove = (e) => {
      e.preventDefault();
      if (joystickTouchId.current === null) return;
      for (const touch of e.changedTouches) {
        if (touch.identifier !== joystickTouchId.current) continue;
        const dx = touch.clientX - joystickCenter.current.x;
        const dy = touch.clientY - joystickCenter.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clamped = Math.min(dist, JOYSTICK_RADIUS - THUMB_RADIUS);
        const ratio = dist > 0 ? clamped / dist : 0;
        setThumbOffset({ x: dx * ratio, y: dy * ratio });
        if (dist > DEAD_ZONE) setDirection(angleToDirection(dx, dy));
        else setDirection(null);
      }
    };

    const handleEnd = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier !== joystickTouchId.current) continue;
        joystickTouchId.current = null;
        setThumbOffset({ x: 0, y: 0 });
        setDirection(null);
        releaseAllDirections();
      }
    };

    const opts = { passive: false };
    el.addEventListener('touchstart', handleStart, opts);
    window.addEventListener('touchmove', handleMove, opts);
    window.addEventListener('touchend', handleEnd, opts);
    window.addEventListener('touchcancel', handleEnd, opts);
    return () => {
      el.removeEventListener('touchstart', handleStart, opts);
      window.removeEventListener('touchmove', handleMove, opts);
      window.removeEventListener('touchend', handleEnd, opts);
      window.removeEventListener('touchcancel', handleEnd, opts);
    };
  }, [mode, setDirection, releaseAllDirections]);

  // D-pad touch handling
  useEffect(() => {
    if (mode !== 'dpad') return;
    const el = movementRef.current;
    if (!el) return;

    const dpadTouches = new Map(); // touchId -> direction key

    const getButtonFromTouch = (touch) => {
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!target) return null;
      return target.closest('[data-dir]')?.dataset.dir || null;
    };

    const handleStart = (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        const dir = getButtonFromTouch(touch);
        if (!dir || !directionKeys[dir]) continue;
        dpadTouches.set(touch.identifier, directionKeys[dir]);
        injectKey(directionKeys[dir]);
      }
    };

    const handleEnd = (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        const key = dpadTouches.get(touch.identifier);
        dpadTouches.delete(touch.identifier);
        if (key) releaseKey(key);
      }
    };

    const opts = { passive: false };
    el.addEventListener('touchstart', handleStart, opts);
    el.addEventListener('touchend', handleEnd, opts);
    el.addEventListener('touchcancel', handleEnd, opts);
    return () => {
      el.removeEventListener('touchstart', handleStart, opts);
      el.removeEventListener('touchend', handleEnd, opts);
      el.removeEventListener('touchcancel', handleEnd, opts);
    };
  }, [mode, injectKey, releaseKey]);

  // Action button touch handling (shared by both modes)
  useEffect(() => {
    const actionArea = actionAreaRef.current;
    if (!actionArea) return;

    const getButtonFromTouch = (touch) => {
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!el) return null;
      return el.closest('[data-btn]')?.dataset.btn || null;
    };

    const handleTouchStart = (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        const btn = getButtonFromTouch(touch);
        if (!btn) continue;
        activeTouches.current.set(touch.identifier, btn);
        if (btn === 'interact') onInteract();
        else if (btn === 'pickup') onPickup();
        else if (btn === 'wear') onWear();
      }
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        const btn = activeTouches.current.get(touch.identifier);
        activeTouches.current.delete(touch.identifier);
        if (btn === 'interact') onInteractRelease();
      }
    };

    const handleTouchCancel = (e) => {
      for (const touch of e.changedTouches) {
        const btn = activeTouches.current.get(touch.identifier);
        activeTouches.current.delete(touch.identifier);
        if (btn === 'interact') onInteractRelease();
      }
    };

    const opts = { passive: false };
    actionArea.addEventListener('touchstart', handleTouchStart, opts);
    actionArea.addEventListener('touchend', handleTouchEnd, opts);
    actionArea.addEventListener('touchcancel', handleTouchCancel, opts);
    return () => {
      actionArea.removeEventListener('touchstart', handleTouchStart, opts);
      actionArea.removeEventListener('touchend', handleTouchEnd, opts);
      actionArea.removeEventListener('touchcancel', handleTouchCancel, opts);
    };
  }, [onPickup, onInteract, onWear, onInteractRelease]);

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
  };

  const joystickSize = JOYSTICK_RADIUS * 2;

  return (
    <div style={{
      position: 'absolute',
      bottom: 'calc(44px + env(safe-area-inset-bottom, 0px))',
      left: 'calc(20px + env(safe-area-inset-left, 0px))',
      right: 'calc(20px + env(safe-area-inset-right, 0px))',
      pointerEvents: 'none',
      zIndex: 500,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    }}>
      {/* Movement control + mode toggle */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
      }}>
        {/* Mode toggle - above movement control */}
        <button
          onClick={onToggleMode}
          style={{
            pointerEvents: 'auto',
            marginBottom: 8,
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 6,
            padding: '3px 10px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: 10,
            cursor: 'pointer',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          {mode === 'joystick' ? '✛ D-pad' : '🕹️ Stick'}
        </button>
        {mode === 'joystick' ? (
          /* Analog joystick */
          <div
            ref={movementRef}
            style={{
              pointerEvents: 'auto',
              width: joystickSize,
              height: joystickSize,
              borderRadius: '50%',
              background: 'rgba(30, 30, 30, 0.45)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              opacity: 0.8,
              boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            {[
              { dir: 'up', top: 6, left: '50%', transform: 'translateX(-50%)', label: '▲' },
              { dir: 'down', bottom: 6, left: '50%', transform: 'translateX(-50%)', label: '▼' },
              { dir: 'left', top: '50%', left: 6, transform: 'translateY(-50%)', label: '◀' },
              { dir: 'right', top: '50%', right: 6, transform: 'translateY(-50%)', label: '▶' },
            ].map(({ dir, label, ...pos }) => (
              <div key={dir} style={{
                position: 'absolute',
                ...pos,
                color: currentDirection.current === dir
                  ? 'rgba(255, 255, 255, 0.8)'
                  : 'rgba(255, 255, 255, 0.2)',
                fontSize: 12,
                userSelect: 'none',
                WebkitUserSelect: 'none',
                transition: 'color 0.1s',
              }}>
                {label}
              </div>
            ))}
            <div style={{
              position: 'absolute',
              width: THUMB_RADIUS * 2,
              height: THUMB_RADIUS * 2,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 35%, rgba(200, 200, 200, 0.7), rgba(120, 120, 120, 0.6))',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${thumbOffset.x}px), calc(-50% + ${thumbOffset.y}px))`,
              transition: joystickTouchId.current !== null ? 'none' : 'transform 0.15s ease-out',
            }} />
          </div>
        ) : (
          /* D-pad */
          <div ref={movementRef} style={{
            pointerEvents: 'auto',
            display: 'grid',
            gridTemplateColumns: `${DPAD_BTN_SIZE}px ${DPAD_BTN_SIZE}px ${DPAD_BTN_SIZE}px`,
            gridTemplateRows: `${DPAD_BTN_SIZE}px ${DPAD_BTN_SIZE}px ${DPAD_BTN_SIZE}px`,
            gap: 4,
            opacity: 0.75,
          }}>
            <div />
            <div data-dir="up" style={dpadBtnStyle}>
              <span style={{ fontSize: 26 }}>&#9650;</span>
            </div>
            <div />
            <div data-dir="left" style={dpadBtnStyle}>
              <span style={{ fontSize: 26 }}>&#9664;</span>
            </div>
            <div style={{
              width: DPAD_BTN_SIZE,
              height: DPAD_BTN_SIZE,
              background: 'rgba(30, 30, 30, 0.5)',
              borderRadius: 10,
            }} />
            <div data-dir="right" style={dpadBtnStyle}>
              <span style={{ fontSize: 26 }}>&#9654;</span>
            </div>
            <div />
            <div data-dir="down" style={dpadBtnStyle}>
              <span style={{ fontSize: 26 }}>&#9660;</span>
            </div>
            <div />
          </div>
        )}

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
