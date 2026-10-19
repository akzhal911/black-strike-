import React, { useRef, useState } from 'react';
import { Crosshair, Shield, Flame, RotateCcw, ArrowUp, ChevronDown, Zap, Repeat } from 'lucide-react';
import { GrenadeType } from '../types/game';

interface MobileControlsProps {
  onMoveInput: (x: number, y: number, sprint: boolean) => void;
  onLookDelta: (dx: number, dy: number) => void;
  onFireStateChange: (firing: boolean) => void;
  onToggleAds: () => void;
  onReload: () => void;
  onThrowGrenade: () => void;
  onCycleGrenade: () => void;
  onSwitchWeapon: () => void;
  onToggleCrouch: () => void;
  onJump: () => void;
  onInteract: () => void;
  isAds: boolean;
  isCrouching: boolean;
  selectedGrenade: GrenadeType;
  grenadeCount: number;
  hasInteractPrompt: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMoveInput,
  onLookDelta,
  onFireStateChange,
  onToggleAds,
  onReload,
  onThrowGrenade,
  onCycleGrenade,
  onSwitchWeapon,
  onToggleCrouch,
  onJump,
  onInteract,
  isAds,
  isCrouching,
  selectedGrenade,
  grenadeCount,
  hasInteractPrompt
}) => {
  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0 });
  const moveTouchId = useRef<number | null>(null);
  const moveOrigin = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const lookTouchId = useRef<number | null>(null);
  const lastLookPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const fireTouchId = useRef<number | null>(null);
  const lastFirePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Left Movement Joystick Handlers
  const handleMoveStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const touch = e.changedTouches[0];
    if (!touch) return;
    moveTouchId.current = touch.identifier;
    const rect = e.currentTarget.getBoundingClientRect();
    moveOrigin.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  };

  const handleMoveMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === moveTouchId.current) {
        const dx = t.clientX - moveOrigin.current.x;
        const dy = t.clientY - moveOrigin.current.y;
        const maxRadius = 48;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, maxRadius);
        const angle = Math.atan2(dy, dx);
        const kx = Math.cos(angle) * clampedDist;
        const ky = Math.sin(angle) * clampedDist;
        setJoyKnob({ x: kx, y: ky });

        const normX = kx / maxRadius;
        const normY = -ky / maxRadius; // Forward is +1
        const isSprinting = dist > maxRadius * 0.82 && normY > 0.45;
        onMoveInput(normX, normY, isSprinting);
      }
    }
  };

  const handleMoveEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === moveTouchId.current) {
        moveTouchId.current = null;
        setJoyKnob({ x: 0, y: 0 });
        onMoveInput(0, 0, false);
      }
    }
  };

  // Right Free-Look Touch Pad Handlers
  const handleLookStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    if (!touch) return;
    lookTouchId.current = touch.identifier;
    lastLookPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLookMove = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === lookTouchId.current) {
        const dx = t.clientX - lastLookPos.current.x;
        const dy = t.clientY - lastLookPos.current.y;
        lastLookPos.current = { x: t.clientX, y: t.clientY };
        onLookDelta(dx * 0.0055, dy * 0.0055);
      }
    }
  };

  const handleLookEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId.current) {
        lookTouchId.current = null;
      }
    }
  };

  // Fire Button also supports dragging thumb while shooting!
  const handleFireTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const t = e.changedTouches[0];
    if (t) {
      fireTouchId.current = t.identifier;
      lastFirePos.current = { x: t.clientX, y: t.clientY };
    }
    onFireStateChange(true);
  };

  const handleFireTouchMove = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === fireTouchId.current) {
        const dx = t.clientX - lastFirePos.current.x;
        const dy = t.clientY - lastFirePos.current.y;
        lastFirePos.current = { x: t.clientX, y: t.clientY };
        onLookDelta(dx * 0.0045, dy * 0.0045);
      }
    }
  };

  const handleFireTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    fireTouchId.current = null;
    onFireStateChange(false);
  };

  return (
    <div className="fixed inset-0 z-20 pointer-events-none select-none touch-none">
      {/* Right Half Look Pad */}
      <div
        className="absolute top-14 right-0 bottom-0 w-3/5 pointer-events-auto"
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
        onTouchCancel={handleLookEnd}
      />

      {/* Left Movement Virtual Thumbstick */}
      <div
        className="
          flex items-center justify-center
          absolute bottom-8 left-6
          w-32 h-32
          bg-slate-950/50 backdrop-blur-sm
          border border-white/15 rounded-full
          pointer-events-auto
        "
        onTouchStart={handleMoveStart}
        onTouchMove={handleMoveMove}
        onTouchEnd={handleMoveEnd}
        onTouchCancel={handleMoveEnd}
      >
        <div className="absolute inset-3 border border-white/10 rounded-full pointer-events-none" />
        <span className="absolute top-2 font-mono text-[9px] text-amber-400/80 tracking-widest">
          SPRINT
        </span>
        <div
          className="
            w-12 h-12
            bg-amber-500/85
            border-2 border-amber-300 rounded-full
            shadow-lg shadow-amber-500/30
            transition-transform duration-75
          "
          style={{
            transform: `translate3d(${joyKnob.x}px, ${joyKnob.y}px, 0)`
          }}
        />
      </div>

      {/* Contextual Interact Button */}
      {hasInteractPrompt && (
        <button
          type="button"
          onTouchStart={(e) => {
            e.stopPropagation();
            onInteract();
          }}
          onClick={onInteract}
          className="
            flex items-center gap-2
            absolute bottom-44 left-1/2 -translate-x-1/2
            min-h-[48px] px-5 py-2.5
            bg-amber-500 text-slate-950
            font-display font-bold text-sm tracking-wider
            rounded-xl shadow-lg shadow-amber-500/30
            pointer-events-auto active:scale-95
          "
        >
          <Zap className="w-4 h-4" />
          <span>ДЕЙСТВИЕ [E]</span>
        </button>
      )}

      {/* Right Ergonomic Tactical Action Cluster */}
      <div className="absolute bottom-6 right-5 flex flex-col items-end gap-3 pointer-events-none">
        {/* Top Row: Weapon Switch, Grenade Cycle, Crouch, Jump */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <button
            type="button"
            onTouchStart={(e) => {
              e.stopPropagation();
              onSwitchWeapon();
            }}
            onClick={onSwitchWeapon}
            className="
              flex items-center justify-center gap-1.5
              min-w-[48px] min-h-[48px] px-3
              bg-slate-900/75 backdrop-blur-md
              border border-white/15 rounded-xl
              font-mono text-xs text-slate-100 whitespace-nowrap
              active:bg-amber-500 active:text-slate-950
            "
          >
            <Repeat className="w-4 h-4" />
            <span>ОРУЖИЕ</span>
          </button>

          <button
            type="button"
            onTouchStart={(e) => {
              e.stopPropagation();
              onToggleCrouch();
            }}
            onClick={onToggleCrouch}
            className={`
              flex items-center justify-center
              min-w-[48px] min-h-[48px]
              backdrop-blur-md border rounded-xl
              ${
                isCrouching
                  ? 'bg-amber-500 text-slate-950 border-amber-300'
                  : 'bg-slate-900/75 text-slate-100 border-white/15'
              }
            `}
            aria-label="Присесть"
          >
            <ChevronDown className="w-5 h-5" />
          </button>

          <button
            type="button"
            onTouchStart={(e) => {
              e.stopPropagation();
              onJump();
            }}
            onClick={onJump}
            className="
              flex items-center justify-center
              min-w-[48px] min-h-[48px]
              bg-slate-900/75 backdrop-blur-md
              border border-white/15 rounded-xl
              text-slate-100 active:bg-white/20
            "
            aria-label="Прыжок"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Primary Combat Row: Grenade, Reload, ADS, Big Fire Trigger */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                onCycleGrenade();
              }}
              onClick={onCycleGrenade}
              className="
                min-h-[32px] px-2
                bg-slate-950/80 border border-white/15 rounded-lg
                font-mono text-[10px] text-amber-400 uppercase whitespace-nowrap
              "
            >
              {selectedGrenade} ({grenadeCount})
            </button>
            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                onThrowGrenade();
              }}
              onClick={onThrowGrenade}
              className="
                flex items-center justify-center
                min-w-[52px] min-h-[52px]
                bg-slate-900/80 backdrop-blur-md
                border border-white/15 rounded-2xl
                text-amber-400 active:scale-95
              "
              aria-label="Бросить гранату"
            >
              <Flame className="w-5 h-5" />
            </button>
          </div>

          <button
            type="button"
            onTouchStart={(e) => {
              e.stopPropagation();
              onReload();
            }}
            onClick={onReload}
            className="
              flex items-center justify-center
              min-w-[54px] min-h-[54px]
              bg-slate-900/80 backdrop-blur-md
              border border-white/15 rounded-2xl
              text-slate-100 active:scale-95
            "
            aria-label="Перезарядка"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            type="button"
            onTouchStart={(e) => {
              e.stopPropagation();
              onToggleAds();
            }}
            onClick={onToggleAds}
            className={`
              flex items-center justify-center
              min-w-[58px] min-h-[58px]
              backdrop-blur-md border rounded-2xl
              ${
                isAds
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-900/80 text-slate-100 border-white/15'
              }
            `}
            aria-label="Прицеливание"
          >
            <Crosshair className="w-6 h-6" />
          </button>

          <button
            type="button"
            onTouchStart={handleFireTouchStart}
            onTouchMove={handleFireTouchMove}
            onTouchEnd={handleFireTouchEnd}
            onTouchCancel={handleFireTouchEnd}
            onMouseDown={() => onFireStateChange(true)}
            onMouseUp={() => onFireStateChange(false)}
            className="
              flex flex-col items-center justify-center
              w-20 h-20
              bg-red-600/90 active:bg-red-500
              border-2 border-red-400 rounded-full
              shadow-xl shadow-red-600/40
              text-white font-display font-bold text-xs tracking-wider
              active:scale-95 transition-transform
            "
          >
            <Shield className="w-6 h-6 mb-0.5" />
            <span>ОГОНЬ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
