import React from 'react';
import {
  Play,
  Crosshair,
  Shield,
  Sliders,
  RotateCcw,
  AlertTriangle,
  Lock,
  Volume2,
  Smartphone,
  Eye,
  Check,
  Award
} from 'lucide-react';
import {
  DifficultyLevel,
  GameSettings,
  MenuScreen,
  MissionConfig,
  PlayerProgression,
  WeaponAttachmentState,
  WeaponId
} from '../types/game';
import { MISSIONS, WEAPONS, WEAPON_SKINS } from '../data/weaponsAndMissions';
import { soundEngine } from '../audio/soundEngine';

interface GameMenusProps {
  screen: MenuScreen;
  setScreen: (s: MenuScreen) => void;
  selectedMissionId: number;
  setSelectedMissionId: (id: number) => void;
  progression: PlayerProgression;
  setProgression: React.Dispatch<React.SetStateAction<PlayerProgression>>;
  settings: GameSettings;
  setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  onStartMission: (mission: MissionConfig) => void;
  onResumeGame: () => void;
  onRestartCheckpoint: () => void;
  lastMissionStats: { kills: number; headshots: number; xpEarned: number; choice: string; timeSeconds?: number };
}

export const GameMenus: React.FC<GameMenusProps> = ({
  screen,
  setScreen,
  selectedMissionId,
  setSelectedMissionId,
  progression,
  setProgression,
  settings,
  setSettings,
  onStartMission,
  onResumeGame,
  onRestartCheckpoint,
  lastMissionStats
}) => {
  const currentMission = MISSIONS.find((m) => m.id === selectedMissionId) || MISSIONS[0];

  const handleNav = (target: MenuScreen) => {
    soundEngine.playUiClick();
    setScreen(target);
  };

  const unlockWeapon = (wId: WeaponId, cost: number) => {
    if (progression.unlockedWeapons.includes(wId)) return;
    if (progression.xp < cost) return;
    soundEngine.playUiClick();
    setProgression((prev) => ({
      ...prev,
      xp: prev.xp - cost,
      unlockedWeapons: [...prev.unlockedWeapons, wId],
      primaryWeapon: wId
    }));
  };

  const updateAttachment = <K extends keyof WeaponAttachmentState>(
    wId: WeaponId,
    key: K,
    val: WeaponAttachmentState[K],
    cost = 0
  ) => {
    if (cost > 0 && progression.xp < cost) return;
    soundEngine.playUiClick();
    setProgression((prev) => ({
      ...prev,
      xp: prev.xp - cost,
      attachments: {
        ...prev.attachments,
        [wId]: {
          ...prev.attachments[wId],
          [key]: val
        }
      }
    }));
  };

  if (screen === 'PLAYING') return null;

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-between bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-transparent text-slate-100 select-none overflow-y-auto">
      {/* Top Bar Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-slate-950/80 backdrop-blur-md border-b border-white/10 shrink-0">
        <button
          type="button"
          onClick={() => handleNav('MAIN')}
          className="flex items-center gap-2 font-display font-bold text-lg sm:text-xl tracking-wider text-white whitespace-nowrap"
        >
          <div className="w-2.5 h-2.5 bg-amber-500 rounded-sm" />
          <span>BLACK STRIKE: REBORN</span>
        </button>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          {(
            [
              { id: 'MAIN', label: 'CAMPAIGN' },
              { id: 'MISSIONS', label: 'MISSIONS' },
              { id: 'LOADOUT', label: 'LOADOUT' },
              { id: 'ARMORY', label: 'ARMORY' },
              { id: 'SETTINGS', label: 'SETTINGS' }
            ] as { id: MenuScreen; label: string }[]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseEnter={() => soundEngine.playUiHover()}
              onClick={() => handleNav(item.id)}
              className={`hover:text-white transition-colors whitespace-nowrap py-1 border-b-2 ${
                screen === item.id ? 'text-amber-400 border-amber-400' : 'border-transparent'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-amber-400 tabular-nums whitespace-nowrap bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/30">
            {settings.difficulty} · XP: {progression.xp}
          </span>
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onStartMission(currentMission);
            }}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs sm:text-sm rounded-lg transition-transform active:scale-95 whitespace-nowrap shadow-md shadow-amber-500/20"
          >
            В БОЙ
          </button>
        </div>
      </header>

      {/* Main Screen Content */}
      <main className="flex-1 flex items-center px-6 sm:px-12 py-6 overflow-y-auto">
        {/* 1. MAIN MENU SCREEN */}
        {screen === 'MAIN' && (
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <div className="text-xs font-mono text-amber-400 tracking-widest uppercase">
                  СЮЖЕТНАЯ КАМПАНИЯ · ДНЕВНОЙ СВЕТ · ТАКТИЧЕСКИЙ 3D FPS
                </div>
                <h1 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight leading-none">
                  BLACK STRIKE: REBORN
                </h1>
                <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                  Освещённый дневной мегаполис, плавное управление, пошаговое обучение бойца, напарник капитан Вэнс и 5 контрольных точек сохранения.
                </p>
              </div>

              {/* Difficulty selector right on main menu */}
              <div className="bg-slate-950/80 border border-white/10 rounded-xl p-3.5 max-w-md">
                <div className="text-xs font-mono text-slate-400 mb-2">
                  ВЫБЕРИТЕ УРОВЕНЬ СЛОЖНОСТИ (ПО УМОЛЧАНИЮ: EASY)
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['STORY', 'EASY', 'NORMAL', 'HARD'] as DifficultyLevel[]).map((diff) => {
                    const active = settings.difficulty === diff;
                    return (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => {
                          soundEngine.playUiClick();
                          setSettings((s) => ({ ...s, difficulty: diff }));
                        }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all ${
                          active
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-white/10'
                        }`}
                      >
                        {diff}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vertical Menu Buttons */}
              <div className="flex flex-col gap-2.5 max-w-xs">
                <button
                  type="button"
                  onMouseEnter={() => soundEngine.playUiHover()}
                  onClick={() => {
                    soundEngine.playUiClick();
                    onStartMission(currentMission);
                  }}
                  className="flex items-center justify-between px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-base rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:translate-x-1.5 whitespace-nowrap"
                >
                  <span>CAMPAIGN · НАЧАТЬ ИГРУ</span>
                  <Play className="w-5 h-5 fill-current" />
                </button>

                <button
                  type="button"
                  onMouseEnter={() => soundEngine.playUiHover()}
                  onClick={() => handleNav('MISSIONS')}
                  className="flex items-center justify-between px-6 py-3 bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-white font-display font-semibold text-sm rounded-xl transition-all hover:translate-x-1.5 whitespace-nowrap"
                >
                  <span>MISSIONS · ВЫБОР МИССИЙ ({MISSIONS.length})</span>
                  <Crosshair className="w-4 h-4 text-amber-400" />
                </button>

                <button
                  type="button"
                  onMouseEnter={() => soundEngine.playUiHover()}
                  onClick={() => handleNav('LOADOUT')}
                  className="flex items-center justify-between px-6 py-3 bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-white font-display font-semibold text-sm rounded-xl transition-all hover:translate-x-1.5 whitespace-nowrap"
                >
                  <span>LOADOUT · АРСЕНАЛ ОРУЖИЯ</span>
                  <Shield className="w-4 h-4 text-cyan-400" />
                </button>

                <button
                  type="button"
                  onMouseEnter={() => soundEngine.playUiHover()}
                  onClick={() => handleNav('SETTINGS')}
                  className="flex items-center justify-between px-6 py-3 bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-white font-display font-semibold text-sm rounded-xl transition-all hover:translate-x-1.5 whitespace-nowrap"
                >
                  <span>SETTINGS · НАСТРОЙКИ</span>
                  <Sliders className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Mission 01 First Contact Briefing */}
              <div className="bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-xl p-4 max-w-lg shadow-lg">
                <div className="text-xs font-mono text-amber-400">
                  ТЕКУЩАЯ ОПЕРАЦИЯ · {currentMission.code}
                </div>
                <div className="font-display font-bold text-base text-white mt-0.5">
                  {currentMission.title}
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {currentMission.briefing}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. MISSIONS SCREEN */}
        {screen === 'MISSIONS' && (
          <div className="w-full max-w-5xl bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display font-bold text-2xl text-white">
                  ВЫБОР ОПЕРАЦИИ
                </h2>
                <p className="text-sm text-slate-400">
                  Все миссии поддерживают контрольные точки сохранения и дневное реалистичное освещение.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleNav('MAIN')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-mono text-slate-200"
              >
                НАЗАД В МЕНЮ
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
              {MISSIONS.map((m) => {
                const isSelected = m.id === selectedMissionId;
                const isCompleted = progression.missionsCompleted.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      soundEngine.playUiClick();
                      setSelectedMissionId(m.id);
                    }}
                    className={`cursor-pointer rounded-xl p-5 border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900 border-amber-400 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-900/50 border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono text-amber-400">
                        <span>ОПЕРАЦИЯ 0{m.id}</span>
                        {isCompleted && <span className="text-emerald-400">ВЫПОЛНЕНО</span>}
                      </div>
                      <h3 className="font-display font-bold text-lg text-white mt-1">
                        {m.title}
                      </h3>
                      <div className="text-xs font-mono text-slate-400 mt-1">
                        {m.districtName}
                      </div>
                      <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                        {m.briefing}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">ПОГОДА: {m.weatherStart}</span>
                      <span className="text-amber-400 font-semibold tabular-nums">
                        +{m.xpReward} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  onStartMission(currentMission);
                }}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm rounded-xl shadow-md"
              >
                НАЧАТЬ: {currentMission.title}
              </button>
            </div>
          </div>
        )}

        {/* 3. LOADOUT SCREEN */}
        {screen === 'LOADOUT' && (
          <div className="w-full max-w-5xl bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display font-bold text-2xl text-white">
                  ТАКТИЧЕСКИЙ АРСЕНАЛ (LOADOUT)
                </h2>
                <p className="text-sm text-slate-400">
                  Штурмовая винтовка, пистолет-пулемёт, дробовик, снайперская винтовка и табельный пистолет.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleNav('MAIN')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-mono text-slate-200"
              >
                НАЗАД
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {(Object.keys(WEAPONS) as WeaponId[]).map((wId) => {
                const w = WEAPONS[wId];
                const unlocked = progression.unlockedWeapons.includes(wId);
                const isPrimary = progression.primaryWeapon === wId;
                const att = progression.attachments[wId];

                return (
                  <div
                    key={wId}
                    className={`rounded-xl p-5 border flex flex-col justify-between ${
                      isPrimary
                        ? 'bg-slate-900 border-amber-400'
                        : 'bg-slate-900/55 border-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-amber-400">{w.category}</span>
                        <span className="text-slate-400">
                          {unlocked ? 'ДОСТУПНО' : `${w.unlockXp} XP`}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-lg text-white mt-1">
                        {w.name}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                        {w.description}
                      </p>

                      <div className="mt-4 space-y-1.5 text-xs font-mono tabular-nums">
                        <div className="flex justify-between text-slate-300">
                          <span>УРОН</span>
                          <span>{w.damage} {w.pellets > 1 ? `× ${w.pellets}` : ''}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>МАГАЗИН / ЗАПАС</span>
                          <span>
                            {att.magazine === 'extended' ? Math.round(w.magSize * 1.35) : w.magSize} / {w.maxReserve}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>ДАЛЬНОСТЬ</span>
                          <span>{w.range} М</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-white/10">
                      {unlocked ? (
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playUiClick();
                            setProgression((p) => ({ ...p, primaryWeapon: wId }));
                          }}
                          className={`w-full py-2 rounded-lg font-display font-semibold text-xs whitespace-nowrap ${
                            isPrimary
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 hover:bg-slate-700 text-white'
                          }`}
                        >
                          {isPrimary ? 'ВЫБРАНО ОСНОВНЫМ' : 'СДЕЛАТЬ ОСНОВНЫМ'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleNav('ARMORY')}
                          className="w-full py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-amber-400 font-mono text-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>ОТКРЫТЬ В ARMORY ({w.unlockXp} XP)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. ARMORY SCREEN */}
        {screen === 'ARMORY' && (
          <div className="w-full max-w-5xl bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display font-bold text-2xl text-white">
                  ОРУЖЕЙНАЯ И МОДИФИКАЦИИ (ARMORY)
                </h2>
                <p className="text-sm text-slate-400">
                  Баланс XP: {progression.xp}. Открывайте новые виды оружия и прицелы.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    setProgression((p) => ({ ...p, xp: p.xp + 500 }));
                  }}
                  className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 rounded-lg text-xs font-mono text-amber-300"
                >
                  +500 XP (ТЕСТОВЫЙ ГРАНТ)
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('MAIN')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-mono text-slate-200"
                >
                  НАЗАД
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
              <div className="lg:col-span-5 space-y-3">
                <h3 className="font-display font-semibold text-base text-amber-400">
                  АРСЕНАЛ ОРУЖИЯ
                </h3>
                {(Object.keys(WEAPONS) as WeaponId[]).map((wId) => {
                  const w = WEAPONS[wId];
                  const unlocked = progression.unlockedWeapons.includes(wId);
                  return (
                    <div
                      key={wId}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/75 border border-white/10"
                    >
                      <div>
                        <div className="font-display font-bold text-sm text-white">
                          {w.name}
                        </div>
                        <div className="text-xs font-mono text-slate-400">{w.category}</div>
                      </div>

                      {unlocked ? (
                        <button
                          type="button"
                          onClick={() => setProgression((p) => ({ ...p, primaryWeapon: wId }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap ${
                            progression.primaryWeapon === wId
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {progression.primaryWeapon === wId ? 'АКТИВНО' : 'ВЫБРАТЬ'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={progression.xp < w.unlockXp}
                          onClick={() => unlockWeapon(wId, w.unlockXp)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-mono font-semibold text-xs whitespace-nowrap"
                        >
                          ОТКРЫТЬ · {w.unlockXp} XP
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="lg:col-span-7 space-y-5 bg-slate-900/55 border border-white/10 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-base text-cyan-400">
                    МОДИФИКАЦИЯ: {WEAPONS[progression.primaryWeapon].name}
                  </h3>
                </div>

                <div>
                  <div className="text-xs font-mono text-slate-400 mb-2">ПРИЦЕЛ (OPTIC)</div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(
                      [
                        { id: 'iron', label: 'МЕХАНИКА' },
                        { id: 'holo', label: 'КОЛЛИМАТОР' },
                        { id: 'acog', label: 'ACOG 4X' }
                      ] as const
                    ).map((opt) => {
                      const active =
                        progression.attachments[progression.primaryWeapon].optic === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            updateAttachment(progression.primaryWeapon, 'optic', opt.id)
                          }
                          className={`py-2 px-3 rounded-lg text-xs font-mono border whitespace-nowrap ${
                            active
                              ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-bold'
                              : 'bg-slate-950/70 text-slate-300 border-white/10 hover:border-white/30'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-mono text-slate-400 mb-2">МАГАЗИН (+35% ПАТРОНОВ)</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['standard', 'extended'] as const).map((mag) => {
                      const active =
                        progression.attachments[progression.primaryWeapon].magazine === mag;
                      return (
                        <button
                          key={mag}
                          type="button"
                          onClick={() =>
                            updateAttachment(progression.primaryWeapon, 'magazine', mag)
                          }
                          className={`py-2 px-3 rounded-lg text-xs font-mono border whitespace-nowrap ${
                            active
                              ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold'
                              : 'bg-slate-950/70 text-slate-300 border-white/10'
                          }`}
                        >
                          {mag === 'standard' ? 'СТАНДАРТ' : 'УВЕЛИЧЕННЫЙ'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-mono text-slate-400 mb-2">ТАКТИЧЕСКИЙ КАМУФЛЯЖ</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(Object.keys(WEAPON_SKINS) as Array<WeaponAttachmentState['skin']>).map(
                      (skinKey) => {
                        const skin = WEAPON_SKINS[skinKey];
                        const active =
                          progression.attachments[progression.primaryWeapon].skin === skinKey;
                        return (
                          <button
                            key={skinKey}
                            type="button"
                            onClick={() =>
                              updateAttachment(progression.primaryWeapon, 'skin', skinKey)
                            }
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              active
                                ? 'bg-slate-800 border-amber-400'
                                : 'bg-slate-950/70 border-white/10 hover:border-white/25'
                            }`}
                          >
                            <div className="font-mono text-[11px] text-white truncate">
                              {skin.name}
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. SETTINGS SCREEN */}
        {screen === 'SETTINGS' && (
          <div className="w-full max-w-3xl bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display font-bold text-2xl text-white">
                  НАСТРОЙКИ (SETTINGS)
                </h2>
                <p className="text-sm text-slate-400">
                  Настройки сложности, чувствительности, инверсии Y и звука.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleNav('MAIN')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-mono text-slate-200"
              >
                СОХРАНИТЬ И ВЫЙТИ
              </button>
            </div>

            <div className="space-y-5 mt-6">
              {/* Difficulty Setting */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Уровень сложности (Difficulty)
                  </div>
                  <div className="text-xs text-slate-400">
                    EASY по умолчанию: больше HP, брони и задержка реакции врагов
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {(['STORY', 'EASY', 'NORMAL', 'HARD'] as DifficultyLevel[]).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, difficulty: diff }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border whitespace-nowrap ${
                        settings.difficulty === diff
                          ? 'bg-amber-500 text-slate-950 border-amber-300'
                          : 'bg-slate-900 text-slate-300 border-white/10'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sensitivity */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Чувствительность прицела (Мышь и Сенсор)
                  </div>
                  <div className="text-xs text-slate-400">
                    Скорость поворота камеры от первого лица
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0.3}
                    max={2.5}
                    step={0.1}
                    value={settings.sensitivity}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, sensitivity: parseFloat(e.target.value) }))
                    }
                    className="w-36 accent-amber-500"
                  />
                  <span className="font-mono text-xs text-amber-400 w-10 tabular-nums">
                    {settings.sensitivity.toFixed(1)}x
                  </span>
                </div>
              </div>

              {/* Invert Y */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Инвертировать ось Y (Invert Mouse Y)
                  </div>
                  <div className="text-xs text-slate-400">
                    Инверсия обзора вверх / вниз
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, invertY: !s.invertY }))}
                  className={`px-4 py-1.5 rounded-lg text-xs font-mono border ${
                    settings.invertY
                      ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold'
                      : 'bg-slate-900 text-slate-300 border-white/10'
                  }`}
                >
                  {settings.invertY ? 'ВКЛЮЧЕНО' : 'ВЫКЛЮЧЕНО'}
                </button>
              </div>

              {/* SFX Volume */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-sm font-semibold text-white">Звуковые эффекты (SFX)</div>
                    <div className="text-xs text-slate-400">
                      Выстрелы, шаги, попадания и рация
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setSettings((s) => ({ ...s, volume: v }));
                      soundEngine.setVolumes(v, settings.musicVolume);
                    }}
                    className="w-36 accent-amber-500"
                  />
                  <span className="font-mono text-xs text-amber-400 w-10 tabular-nums">
                    {Math.round(settings.volume * 100)}%
                  </span>
                </div>
              </div>

              {/* Music Volume */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Динамическая музыка
                  </div>
                  <div className="text-xs text-slate-400">
                    Адаптивный тактический саундтрек
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.musicVolume}
                    onChange={(e) => {
                      const mv = parseFloat(e.target.value);
                      setSettings((s) => ({ ...s, musicVolume: mv }));
                      soundEngine.setVolumes(settings.volume, mv);
                    }}
                    className="w-36 accent-amber-500"
                  />
                  <span className="font-mono text-xs text-amber-400 w-10 tabular-nums">
                    {Math.round(settings.musicVolume * 100)}%
                  </span>
                </div>
              </div>

              {/* Mobile / Touch Mode */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-sm font-semibold text-white">
                      Сенсорное управление (Touch Controls)
                    </div>
                    <div className="text-xs text-slate-400">
                      Виртуальные джойстики и тактические кнопки
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {(['AUTO', 'ALWAYS_ON', 'OFF'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, touchControlsMode: mode }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono border whitespace-nowrap ${
                        settings.touchControlsMode === mode
                          ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-bold'
                          : 'bg-slate-900 text-slate-300 border-white/10'
                      }`}
                    >
                      {mode === 'AUTO' ? 'АВТО' : mode === 'ALWAYS_ON' ? 'ВКЛ' : 'ВЫКЛ'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. PAUSE SCREEN */}
        {screen === 'PAUSED' && (
          <div className="w-full max-w-md mx-auto bg-slate-950/95 backdrop-blur-md border border-white/15 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <h2 className="font-display font-bold text-2xl text-white">ПАУЗА</h2>
            <p className="text-xs text-slate-400 font-mono">{currentMission.title}</p>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={onResumeGame}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm rounded-xl"
              >
                RESUME · ПРОДОЛЖИТЬ
              </button>
              <button
                type="button"
                onClick={onRestartCheckpoint}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-display font-semibold text-sm rounded-xl flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>RESTART CHECKPOINT · К КОНТРОЛЬНОЙ ТОЧКЕ</span>
              </button>
              <button
                type="button"
                onClick={() => handleNav('SETTINGS')}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 font-display font-semibold text-sm rounded-xl"
              >
                SETTINGS · НАСТРОЙКИ
              </button>
              <button
                type="button"
                onClick={() => handleNav('MAIN')}
                className="w-full py-3 bg-red-950/60 hover:bg-red-900/70 border border-red-500/30 text-red-200 font-display font-semibold text-sm rounded-xl"
              >
                MAIN MENU · ГЛАВНОЕ МЕНЮ
              </button>
            </div>
          </div>
        )}

        {/* 7. GAME OVER SCREEN (With Respawn from Checkpoint!) */}
        {screen === 'GAMEOVER' && (
          <div className="w-full max-w-lg mx-auto bg-slate-950/95 backdrop-blur-md border border-red-500/50 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
            <div className="text-xs font-mono text-red-400 tracking-widest">
              ОПЕРАТИВНИК ПОГИБ В БОЮ (KIA)
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-red-500">
              МИССИЯ ПРОВАЛЕНА
            </h2>
            <p className="text-sm text-slate-300">
              Вы можете возродиться на последней сохранённой контрольной точке с полным здоровьем и боезапасом.
            </p>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={onRestartCheckpoint}
                className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-display font-bold text-base rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
              >
                <RotateCcw className="w-5 h-5" />
                <span>ВОЗРОДИТЬСЯ С КОНТРОЛЬНОЙ ТОЧКИ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSettings((s) => ({ ...s, difficulty: 'STORY' }));
                  onRestartCheckpoint();
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-xs rounded-xl"
              >
                СНИЗИТЬ СЛОЖНОСТЬ ДО STORY И ВОЗРОДИТЬСЯ
              </button>

              <button
                type="button"
                onClick={() => handleNav('MAIN')}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 font-mono text-xs rounded-xl"
              >
                ГЛАВНОЕ МЕНЮ
              </button>
            </div>
          </div>
        )}

        {/* 8. MISSION COMPLETE SCREEN */}
        {screen === 'VICTORY' && (
          <div className="w-full max-w-xl mx-auto bg-slate-950/95 backdrop-blur-md border border-emerald-500/50 rounded-2xl p-8 space-y-5 shadow-2xl">
            <div className="text-xs font-mono text-emerald-400 tracking-widest">
              ЭВАКУАЦИЯ УСПЕШНА · БОРТ «RAVEN-1» В ВОЗДУХЕ
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
              MISSION 01 COMPLETE
            </h2>
            <p className="text-sm text-slate-300">
              Диск с секретными данными «KRONOS» захвачен. Вся группа успешно покинула сектор.
            </p>

            <div className="grid grid-cols-3 gap-3 bg-slate-900/90 border border-white/10 rounded-xl p-4 font-mono tabular-nums text-center">
              <div>
                <div className="text-xs text-slate-400">УСТРАНЕНО</div>
                <div className="text-xl font-bold text-white mt-1">{lastMissionStats.kills}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">В ГОЛОВУ</div>
                <div className="text-xl font-bold text-amber-400 mt-1">
                  {lastMissionStats.headshots}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">НАЧИСЛЕНО XP</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  +{lastMissionStats.xpEarned}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playRadioBeep();
                setScreen('TWIST');
              }}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm rounded-xl shadow-lg"
            >
              ПЕРЕЙТИ К СВОДКЕ ШТАБА →
            </button>
          </div>
        )}

        {/* 9. PLOT TWIST SCREEN */}
        {screen === 'TWIST' && (
          <div className="w-full max-w-2xl mx-auto bg-black/95 border-2 border-red-500/70 rounded-2xl p-8 text-center space-y-6 shadow-2xl shadow-red-900/40">
            <div className="flex items-center justify-center gap-2 text-red-500 font-mono text-xs tracking-widest animate-pulse">
              <AlertTriangle className="w-5 h-5" />
              <span>ПЕРЕХВАТ ЭКСТРЕННОЙ ЧАСТОТЫ КОМАНДОВАНИЯ</span>
            </div>

            <div className="space-y-2 py-4 border-y border-red-500/30">
              <div className="font-mono font-bold text-2xl sm:text-4xl text-red-500 tracking-wider">
                WARNING.
              </div>
              <div className="font-mono font-bold text-xl sm:text-3xl text-white tracking-wide">
                SECONDARY SIGNAL DETECTED.
              </div>
              <p className="text-sm text-slate-300 max-w-lg mx-auto pt-3 leading-relaxed">
                Захваченный сервер в офисном комплексе указал на секретную цитадель «KRONOS». Командир Вэнс готовит штурмовую группу к следующей операции.
              </p>
            </div>

            <div className="font-display font-bold text-lg tracking-[0.25em] text-amber-400">
              TO BE CONTINUED...
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const nextMission = MISSIONS[1];
                  setSelectedMissionId(nextMission.id);
                  onStartMission(nextMission);
                }}
                className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm rounded-xl"
              >
                ОПЕРАЦИЯ 02: CITADEL ASSAULT
              </button>
              <button
                type="button"
                onClick={() => handleNav('MAIN')}
                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-display font-semibold text-sm rounded-xl"
              >
                ГЛАВНОЕ МЕНЮ
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Quiet Clean Footer */}
      <footer className="px-6 py-3 bg-slate-950/80 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 shrink-0">
        <span>BLACK STRIKE: REBORN · MODERN 3D TACTICAL FPS</span>
        <span>
          5 ЭТАПОВ: ИНСТРУКТАЖ → КПП → ОФИС → ДАННЫЕ → ЭВАКУАЦИЯ
        </span>
      </footer>
    </div>
  );
};
