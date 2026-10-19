import React from 'react';
import {
  Radio,
  Pause,
  Smartphone,
  ShieldAlert,
  Zap,
  Lock,
  Compass,
  CheckCircle2,
  Navigation,
  Crosshair as CrosshairIcon,
  Shield,
  Heart
} from 'lucide-react';
import { HUDState, TacticalChoiceOption } from '../types/game';

interface TacticalHUDProps {
  hud: HUDState;
  isTouchActive: boolean;
  isPointerLocked: boolean;
  onRequestPointerLock: () => void;
  onPause: () => void;
  onToggleTouchMode: () => void;
  onSelectTacticalChoice: (choice: TacticalChoiceOption) => void;
  onSkipTutorial: () => void;
}

export const TacticalHUD: React.FC<TacticalHUDProps> = ({
  hud,
  isTouchActive,
  isPointerLocked,
  onRequestPointerLock,
  onPause,
  onToggleTouchMode,
  onSelectTacticalChoice,
  onSkipTutorial
}) => {
  const isSniperScoped = hud.isAds && hud.currentWeapon.id === 'sniper';
  const isLowAmmo = hud.currentMag <= Math.ceil(hud.currentWeapon.magSize * 0.25);
  const isCriticalHealth = hud.hp <= 35;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none select-none overflow-hidden">
      {/* Damage Red Vignette */}
      <div
        className="absolute inset-0 transition-opacity duration-150 pointer-events-none"
        style={{
          opacity: Math.max(hud.damageFlash, isCriticalHealth ? 0.45 : 0),
          background:
            'radial-gradient(circle, transparent 48%, rgba(220, 38, 38, 0.7) 100%)'
        }}
      />

      {/* Flashbang Blindness Overlay */}
      {hud.flashbangBlindness > 0.01 && (
        <div
          className="absolute inset-0 bg-white pointer-events-none transition-opacity duration-100"
          style={{ opacity: hud.flashbangBlindness }}
        />
      )}

      {/* Directional Damage Hit Indicators (Points towards attacker) */}
      {hud.damageIndicators.map((ind) => (
        <div
          key={ind.id}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none animate-ping"
          style={{
            transform: `translate(-50%, -50%) rotate(${ind.angle}rad)`
          }}
        >
          <div className="w-10 h-3 bg-red-600 rounded-full mx-auto shadow-lg shadow-red-500/80" />
        </div>
      ))}

      {/* In-World 3D Floating Waypoint Marker */}
      {hud.waypoint && (
        <>
          {hud.waypoint.screenX !== null && hud.waypoint.screenY !== null && !hud.waypoint.isBehind && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all duration-75"
              style={{
                left: `${hud.waypoint.screenX * 100}%`,
                top: `${hud.waypoint.screenY * 100}%`
              }}
            >
              <div className="w-4 h-4 rotate-45 border-2 border-amber-400 bg-amber-500/30 shadow-md shadow-amber-500/50 animate-pulse" />
              <div className="mt-1 px-2 py-0.5 bg-slate-950/85 border border-amber-400/60 rounded text-[10px] font-mono font-bold text-amber-300 tabular-nums">
                {hud.waypoint.distance}M
              </div>
            </div>
          )}

          {/* Off-screen or Behind Arrow Guide */}
          {hud.waypoint.isBehind && (
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 bg-amber-500/90 text-slate-950 rounded-full font-mono text-xs font-bold shadow-lg animate-bounce pointer-events-none">
              <Navigation className="w-4 h-4 rotate-180 fill-current" />
              <span>ЦЕЛЬ ПОЗАДИ · {hud.waypoint.distance}M</span>
            </div>
          )}
        </>
      )}

      {/* Sniper High-Magnification Scope Overlay */}
      {isSniperScoped && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/85 pointer-events-none">
          <div className="relative w-[72vmin] h-[72vmin] rounded-full border-2 border-cyan-400/60 shadow-[0_0_0_9999px_rgba(4,7,11,0.94)] overflow-hidden">
            {/* Crosshair lines */}
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-cyan-400/70" />
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-400/70" />
            {/* Mil-dots */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border border-red-500 rounded-full" />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-xs text-cyan-300 tabular-nums">
              MSR .338 OPTIC · 8.0X · ДИСТ: {hud.waypoint?.distance || 50}M
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Center Crosshair & Hitmarker */}
      {!isSniperScoped && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          {!hud.isAds && (
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-sm" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1.5px] h-2 bg-white/90" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1.5px] h-2 bg-white/90" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-[1.5px] bg-white/90" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-[1.5px] bg-white/90" />
            </div>
          )}

          {/* Hitmarker X & Locational Hit Zone */}
          {hud.hitMarker && hud.hitMarker.active && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div
                className={`w-6 h-6 rotate-45 border-2 ${
                  hud.hitMarker.zone === 'HEAD' || hud.hitMarker.killed
                    ? 'border-red-500 scale-125'
                    : 'border-white'
                } transition-transform duration-75`}
              />
              <span
                className={`mt-5 font-mono text-[10px] font-bold tracking-wider whitespace-nowrap px-1.5 py-0.5 rounded ${
                  hud.hitMarker.zone === 'HEAD'
                    ? 'bg-red-950/80 text-red-300 border border-red-500/50'
                    : 'bg-slate-900/80 text-amber-300'
                }`}
              >
                {hud.hitMarker.zone}
                {hud.hitMarker.killed ? ' · ПОРАЖЁН' : ''}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Checkpoint Saved Banner */}
      {hud.checkpointNotification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-emerald-950/90 border border-emerald-400 text-emerald-200 rounded-xl shadow-xl font-mono text-xs sm:text-sm animate-bounce pointer-events-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-bold">{hud.checkpointNotification}</span>
        </div>
      )}

      {/* Top Bar: Objective (Left), Compass & Difficulty (Center), Utility Controls (Right) */}
      <div className="absolute top-3 inset-x-4 flex items-start justify-between gap-4">
        {/* Objective Panel */}
        <div className="bg-slate-950/80 backdrop-blur-md border border-white/15 rounded-xl px-4 py-2.5 max-w-sm shadow-lg">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
            <span className="font-bold">
              ЗАДАЧА {hud.objectiveStep} ИЗ {hud.objectiveTotalSteps}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {hud.waypoint ? `${hud.waypoint.distance} М` : 'СЕКТОР'}
            </span>
          </div>
          <div className="font-display font-bold text-sm sm:text-base text-white tracking-wide mt-0.5">
            {hud.objectiveTitle}
          </div>
          <div className="text-xs text-slate-300 mt-0.5">{hud.objectiveSub}</div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-1.5">
            <span className="text-slate-300">{hud.currentDistrict}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums text-amber-400">ВРАГИ: {hud.enemiesRemaining}</span>
          </div>
        </div>

        {/* Center Compass & Difficulty */}
        <div className="hidden md:flex flex-col items-center gap-1.5">
          <div className="bg-slate-950/80 backdrop-blur-md border border-white/15 rounded-lg px-4 py-1.5 text-xs font-mono text-slate-300 flex items-center gap-3 shadow-md">
            <span className="text-amber-400 font-semibold tabular-nums">
              АЗИМУТ {Math.round(hud.compassHeading)}°
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-bold uppercase">
              СЛОЖНОСТЬ: {hud.difficulty}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-300">{hud.activePathsText}</span>
          </div>

          {hud.extractionTimer !== null && (
            <div className="bg-red-950/90 border border-red-500 rounded-lg px-4 py-1.5 flex items-center gap-2 text-red-200 font-mono text-xs animate-pulse shadow-lg">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>ДО ЭВАКУАЦИИ RAVEN-1:</span>
              <span className="font-bold text-sm text-white tabular-nums">
                {Math.floor(hud.extractionTimer / 60)}:
                {String(Math.floor(hud.extractionTimer % 60)).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {/* Top-Right Utility Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onToggleTouchMode}
            className={`min-h-[42px] px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-sm ${
              isTouchActive
                ? 'bg-amber-500 text-slate-950 border-amber-300 font-semibold'
                : 'bg-slate-950/80 text-slate-200 border-white/15 hover:bg-white/10'
            }`}
            title="Переключить сенсорное управление (Touch Mode)"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">TOUCH</span>
          </button>

          <button
            type="button"
            onClick={onPause}
            className="min-h-[42px] px-3.5 py-1.5 bg-slate-950/80 hover:bg-slate-900 backdrop-blur-md border border-white/15 rounded-lg text-xs font-mono text-slate-100 flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-sm"
          >
            <Pause className="w-4 h-4" />
            <span>МЕНЮ [ESC]</span>
          </button>
        </div>
      </div>

      {/* Tutorial Banner (Step-by-step instructions at top center) */}
      {hud.tutorial.active && !hud.tutorial.completed && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 max-w-md w-[92%] bg-slate-950/95 border-2 border-amber-400/80 rounded-2xl p-4 shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between text-xs font-mono text-amber-400">
            <span>ОБУЧЕНИЕ БОЙЦА · ШАГ {hud.tutorial.step + 1} ИЗ 4</span>
            <button
              type="button"
              onClick={onSkipTutorial}
              className="text-[11px] underline text-slate-400 hover:text-white"
            >
              ПРОПУСТИТЬ ОБУЧЕНИЕ
            </button>
          </div>
          <div className="font-display font-bold text-base text-white mt-1">
            {hud.tutorial.title}
          </div>
          <div className="text-xs text-slate-300 mt-1 leading-relaxed">
            {hud.tutorial.instruction}
          </div>
        </div>
      )}

      {/* Incoming Radio Communication (РАЦИЯ) */}
      {hud.activeRadio && (
        <div className="absolute top-36 left-4 max-w-xs sm:max-w-sm bg-slate-950/90 backdrop-blur-md border-l-4 border-cyan-400 rounded-r-xl px-4 py-3 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-semibold">{hud.activeRadio.sender}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400">{hud.activeRadio.role}</span>
          </div>
          <p className="text-sm text-slate-100 mt-1 leading-snug">
            «{hud.activeRadio.text}»
          </p>
        </div>
      )}

      {/* Desktop PointerLock Engagement Banner */}
      {!isTouchActive && !isPointerLocked && !hud.showChoicePrompt && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <button
            type="button"
            onClick={onRequestPointerLock}
            className="bg-slate-950/95 hover:bg-slate-900 border-2 border-amber-500 rounded-2xl px-8 py-5 text-center shadow-2xl transition-transform active:scale-95"
          >
            <div className="font-display font-bold text-lg text-amber-400 tracking-wider">
              КЛИКНИТЕ ДЛЯ ЗАХВАТА ПРИЦЕЛА
            </div>
            <div className="text-xs text-slate-300 mt-1.5">
              WASD — Движение · Shift — Бег · ЛКМ — Огонь · ПКМ — Прицел · R — Перезарядка · 1-5 — Оружие
            </div>
          </button>
        </div>
      )}

      {/* Contextual Interact Banner */}
      {hud.interactPrompt && !hud.showChoicePrompt && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur-md border border-amber-400 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-mono text-amber-300 whitespace-nowrap shadow-xl">
          {hud.interactPrompt}
        </div>
      )}

      {/* Mid-Mission Tactical Choice Modal */}
      {hud.showChoicePrompt && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-slate-950/95 border border-white/20 rounded-2xl p-6 max-w-xl w-full shadow-2xl">
            <div className="text-xs font-mono text-amber-400">
              ТАКТИЧЕСКОЕ РЕШЕНИЕ · ЭНЕРГОБЛОК
            </div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-white mt-1">
              ВЫБЕРИТЕ СЦЕНАРИЙ ШТУРМА
            </h2>
            <p className="text-sm text-slate-300 mt-2">
              Ваш выбор изменит освещение комплекса и тактику отрядов противника.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <button
                type="button"
                onClick={() => onSelectTacticalChoice('DESTROY_GENERATOR')}
                className="flex flex-col items-start text-left p-4 rounded-xl bg-slate-900/90 hover:bg-red-950/50 border border-red-500/40 transition-colors"
              >
                <div className="flex items-center gap-2 text-red-400 font-display font-bold text-sm">
                  <Zap className="w-4 h-4" />
                  <span>ВАРИАНТ A [1]: ВЗОРВАТЬ ГЕНЕРАТОР</span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Обесточивает комплекс. Включается аварийное красное освещение, турели отключаются, враги дезориентированы.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onSelectTacticalChoice('DISABLE_ALARM')}
                className="flex flex-col items-start text-left p-4 rounded-xl bg-slate-900/90 hover:bg-cyan-950/50 border border-cyan-500/40 transition-colors"
              >
                <div className="flex items-center gap-2 text-cyan-400 font-display font-bold text-sm">
                  <Lock className="w-4 h-4" />
                  <span>ВАРИАНТ B [2]: ОТКЛЮЧИТЬ СИГНАЛИЗАЦИЮ</span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Скрытный взлом терминала. Блокирует прибытие подкрепления тяжёлых штурмовиков.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom HUD Row */}
      <div
        className={`absolute inset-x-4 flex items-end justify-between pointer-events-none ${
          isTouchActive ? 'bottom-40 sm:bottom-6' : 'bottom-5'
        }`}
      >
        {/* Bottom-Left: Health, Armor, Stance & Companion Status */}
        <div className="bg-slate-950/85 backdrop-blur-md border border-white/15 rounded-xl px-4 py-3 min-w-[230px] shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="font-bold text-white">ZERO-1</span>
            <span>{hud.isCrouching ? 'ПРИСЕД' : hud.isSprinting ? 'СПРИНТ' : 'СТОЙКА'}</span>
          </div>

          {/* Health Bar */}
          <div className="flex items-baseline justify-between mt-1.5">
            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-semibold">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>HP</span>
            </div>
            <span
              className={`font-mono font-bold text-lg tabular-nums ${
                isCriticalHealth ? 'text-red-400' : 'text-white'
              }`}
            >
              {Math.max(0, Math.ceil(hud.hp))} / {hud.maxHp}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-0.5">
            <div
              className={`h-full transition-all duration-150 ${
                isCriticalHealth ? 'bg-red-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100))}%` }}
            />
          </div>

          {/* Armor Bar */}
          <div className="flex items-baseline justify-between mt-2">
            <div className="flex items-center gap-1.5 text-xs font-mono text-sky-400 font-semibold">
              <Shield className="w-3.5 h-3.5 fill-current" />
              <span>БРОНЯ</span>
            </div>
            <span className="font-mono font-bold text-sm text-sky-300 tabular-nums">
              {Math.max(0, Math.ceil(hud.armor))} / {hud.maxArmor}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
            <div
              className="h-full bg-sky-400 transition-all duration-150"
              style={{ width: `${Math.max(0, Math.min(100, (hud.armor / hud.maxArmor) * 100))}%` }}
            />
          </div>

          {/* Companion Vance / Ghost Status */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-300 mt-2.5 pt-1.5 border-t border-white/10">
            <span>НАПАРНИК:</span>
            <span className="text-slate-300 truncate">{hud.companionStatus}</span>
          </div>
        </div>

        {/* Bottom-Right: Current Weapon, Magazine & Ammo Reserve */}
        <div className="bg-slate-950/85 backdrop-blur-md border border-white/15 rounded-xl px-4 py-3 min-w-[240px] text-right shadow-lg">
          <div className="flex items-center justify-end gap-2 text-xs font-mono text-amber-400">
            <span>{hud.currentWeapon.category}</span>
            <span aria-hidden="true">·</span>
            <span className="text-white font-bold">{hud.currentWeapon.name}</span>
          </div>

          <div className="flex items-baseline justify-end gap-2 mt-1">
            {hud.isReloading ? (
              <span className="font-mono font-bold text-base text-amber-400 animate-pulse">
                ПЕРЕЗАРЯДКА...
              </span>
            ) : (
              <>
                <span
                  className={`font-mono font-bold text-3xl tabular-nums ${
                    isLowAmmo ? 'text-amber-400' : 'text-white'
                  }`}
                >
                  {hud.currentMag}
                </span>
                <span className="font-mono text-base text-slate-400 tabular-nums">
                  / {hud.reserveAmmo}
                </span>
              </>
            )}
          </div>

          {/* Grenades & Quick Slots */}
          <div className="flex items-center justify-end gap-2 text-[11px] font-mono text-slate-300 mt-2 pt-1 border-t border-white/10">
            <span>ГРАНАТА [G]:</span>
            <span className="text-amber-400 font-bold uppercase">
              {hud.selectedGrenade} ({hud.grenades[hud.selectedGrenade]})
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400">[Q] ТИП</span>
          </div>
        </div>
      </div>
    </div>
  );
};
