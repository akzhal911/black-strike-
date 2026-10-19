/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  ActiveGrenade,
  CompanionEntity,
  DamageIndicator,
  DifficultyLevel,
  EnemyArchetype,
  EnemyEntity,
  GameSettings,
  GrenadeType,
  HitZone,
  HUDState,
  MenuScreen,
  MissionConfig,
  ParticleBurst,
  PlayerProgression,
  RadioMessage,
  SmokeCloud,
  TacticalChoiceOption,
  TutorialState,
  WaypointInfo,
  WeaponId,
  WeaponRuntimeState,
  WeatherState
} from './types/game';
import {
  DEFAULT_PROGRESSION,
  DEFAULT_SETTINGS,
  MISSIONS,
  WEAPONS
} from './data/weaponsAndMissions';
import { soundEngine } from './audio/soundEngine';
import { FirstPersonWeaponRig } from './engine/FirstPersonWeapon';
import {
  buildGameWorld,
  BuiltWorldData,
  createCompanionEntity,
  createEnemyEntity
} from './engine/worldBuilder';
import { TacticalHUD } from './components/TacticalHUD';
import { MobileControls } from './components/MobileControls';
import { GameMenus } from './components/GameMenus';

const STORAGE_KEY_PROG = 'black_strike_reborn_prog_v2';
const STORAGE_KEY_SETTINGS = 'black_strike_reborn_settings_v2';

export default function App() {
  const [progression, setProgression] = useState<PlayerProgression>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROG);
      if (saved) return { ...DEFAULT_PROGRESSION, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_PROGRESSION;
  });

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROG, JSON.stringify(progression));
    } catch {
      // ignore
    }
  }, [progression]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  const [screen, setScreen] = useState<MenuScreen>('MAIN');
  const [selectedMissionId, setSelectedMissionId] = useState<number>(1);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [lastMissionStats, setLastMissionStats] = useState({
    kills: 0,
    headshots: 0,
    xpEarned: 600,
    choice: 'NONE',
    timeSeconds: 0
  });

  const [hudState, setHudState] = useState<HUDState>({
    hp: 200,
    maxHp: 200,
    armor: 100,
    maxArmor: 100,
    stamina: 100,
    difficulty: 'EASY',
    isAds: false,
    isCrouching: false,
    isSprinting: false,
    isReloading: false,
    currentWeapon: WEAPONS.assault_rifle,
    currentMag: 30,
    reserveAmmo: 180,
    allWeapons: [],
    grenades: { frag: 3, smoke: 2, flash: 2 },
    selectedGrenade: 'frag',
    objectiveStep: 1,
    objectiveTotalSteps: 5,
    objectiveTitle: 'ДОБРАТЬСЯ ДО КПП ПЕРЕДОВОЙ БАЗЫ',
    objectiveSub: 'Пройдите инструктаж капитана Вэнса и откройте ворота выхода в город',
    objectiveStatusBanner: null,
    waypoint: null,
    currentDistrict: 'ПЕРЕДОВАЯ БАЗА АЛЬФА',
    activePathsText: 'БЕЗОПАСНАЯ ЗОНА',
    weather: 'DAYLIGHT',
    hitMarker: null,
    damageFlash: 0,
    damageIndicators: [],
    flashbangBlindness: 0,
    activeRadio: null,
    companionStatus: 'Капитан Вэнс рядом',
    interactPrompt: null,
    showChoicePrompt: false,
    tacticalChoiceMade: 'NONE',
    extractionTimer: null,
    enemiesRemaining: 12,
    kills: 0,
    headshots: 0,
    compassHeading: 0,
    tutorial: {
      active: true,
      step: 0,
      title: 'ШАГ 1: ПЕРЕДВИЖЕНИЕ И ОБЗОР',
      instruction: 'Используйте клавиши [W, A, S, D] для ходьбы и мышь для поворота камеры.',
      completed: false
    },
    checkpointNotification: null
  });

  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  // Mutable Game Engine Reference
  const engineRef = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    world: BuiltWorldData | null;
    weaponRig: FirstPersonWeaponRig | null;
    ambientLight: THREE.HemisphereLight | null;

    // Player State
    playerPos: THREE.Vector3;
    playerVel: THREE.Vector3;
    yaw: number;
    pitch: number;
    onGround: boolean;
    isCrouching: boolean;
    isSprinting: boolean;
    isAds: boolean;
    isFiring: boolean;
    isReloading: boolean;
    reloadEndTime: number;
    lastShotTime: number;
    lastFootstepTime: number;
    hp: number;
    maxHp: number;
    armor: number;
    maxArmor: number;
    damageFlash: number;
    damageIndicators: DamageIndicator[];
    flashbangBlindness: number;
    cameraShake: number;

    // Inputs
    keys: Record<string, boolean>;
    touchMove: { x: number; y: number; sprint: boolean };

    // Arsenal
    weapons: WeaponRuntimeState[];
    currentWeaponIdx: number;
    grenades: Record<GrenadeType, number>;
    selectedGrenade: GrenadeType;

    // Entities & Pickups
    enemies: EnemyEntity[];
    companion: CompanionEntity | null;
    activeGrenades: ActiveGrenade[];
    smokeClouds: SmokeCloud[];
    particles: ParticleBurst[];
    bulletDecals: THREE.Mesh[];

    // Objectives, Checkpoints & Tutorial
    currentCheckpointIdx: number;
    objectiveStep: number;
    tutorialStep: number;
    tutorialActive: boolean;
    tutorialCompleted: boolean;
    initialDistanceMoved: number;
    initialPosition: THREE.Vector3;
    scoutPatrolEliminated: boolean;
    dataDriveSecured: boolean;
    counterattackTriggered: boolean;
    counterattackEliminated: boolean;
    extractionStarted: boolean;
    tacticalChoice: TacticalChoiceOption;
    showChoiceModal: boolean;
    extractionTimer: number | null;
    missionStartTime: number;
    kills: number;
    headshots: number;
    activeRadio: RadioMessage | null;
    radioExpiresAt: number;
    checkpointNoticeText: string | null;
    checkpointNoticeExpiresAt: number;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    world: null,
    weaponRig: null,
    ambientLight: null,

    playerPos: new THREE.Vector3(0, 1.7, 52),
    playerVel: new THREE.Vector3(),
    yaw: 0,
    pitch: 0,
    onGround: true,
    isCrouching: false,
    isSprinting: false,
    isAds: false,
    isFiring: false,
    isReloading: false,
    reloadEndTime: 0,
    lastShotTime: 0,
    lastFootstepTime: 0,
    hp: 200,
    maxHp: 200,
    armor: 100,
    maxArmor: 100,
    damageFlash: 0,
    damageIndicators: [],
    flashbangBlindness: 0,
    cameraShake: 0,

    keys: {},
    touchMove: { x: 0, y: 0, sprint: false },

    weapons: [],
    currentWeaponIdx: 0,
    grenades: { frag: 3, smoke: 2, flash: 2 },
    selectedGrenade: 'frag',

    enemies: [],
    companion: null,
    activeGrenades: [],
    smokeClouds: [],
    particles: [],
    bulletDecals: [],

    currentCheckpointIdx: 0,
    objectiveStep: 1,
    tutorialStep: 0,
    tutorialActive: true,
    tutorialCompleted: false,
    initialDistanceMoved: 0,
    initialPosition: new THREE.Vector3(0, 1.7, 52),
    scoutPatrolEliminated: false,
    dataDriveSecured: false,
    counterattackTriggered: false,
    counterattackEliminated: false,
    extractionStarted: false,
    tacticalChoice: 'NONE',
    showChoiceModal: false,
    extractionTimer: null,
    missionStartTime: 0,
    kills: 0,
    headshots: 0,
    activeRadio: null,
    radioExpiresAt: 0,
    checkpointNoticeText: null,
    checkpointNoticeExpiresAt: 0
  });

  const screenRef = useRef<MenuScreen>(screen);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  const settingsRef = useRef<GameSettings>(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const progressionRef = useRef<PlayerProgression>(progression);
  useEffect(() => {
    progressionRef.current = progression;
    const eng = engineRef.current;
    if (eng.weaponRig && eng.weapons[eng.currentWeaponIdx]) {
      const wId = eng.weapons[eng.currentWeaponIdx].id;
      eng.weaponRig.buildWeaponModel(wId, progression.attachments[wId]);
    }
  }, [progression]);

  // Touch Detection
  useEffect(() => {
    const hasTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;
    setIsTouchDevice(hasTouch);
  }, []);

  const isTouchActive =
    settings.touchControlsMode === 'ALWAYS_ON' ||
    (settings.touchControlsMode === 'AUTO' && isTouchDevice);

  // Helper for radio transmissions
  const triggerRadio = useCallback(
    (sender: string, role: string, text: string, durationMs = 5500) => {
      const eng = engineRef.current;
      soundEngine.playRadioBeep();
      eng.activeRadio = {
        id: `${Date.now()}`,
        sender,
        role,
        text,
        durationMs
      };
      eng.radioExpiresAt = performance.now() + durationMs;
    },
    []
  );

  // Helper for particle bursts
  const spawnParticleBurst = useCallback(
    (pos: THREE.Vector3, type: ParticleBurst['type'], count = 18) => {
      const eng = engineRef.current;
      if (!eng.scene) return;

      if (type === 'shell') {
        const shellGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.032, 6);
        const shellMat = new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          metalness: 0.9,
          roughness: 0.2
        });
        const shellMesh = new THREE.Mesh(shellGeo, shellMat);
        shellMesh.position.copy(pos);
        eng.scene.add(shellMesh);
        eng.particles.push({
          mesh: shellMesh,
          createdAt: performance.now(),
          duration: 900,
          type: 'shell',
          velocityVec: new THREE.Vector3(
            (Math.random() * 1.5 + 1.2) * Math.cos(eng.yaw),
            1.6 + Math.random() * 0.8,
            (Math.random() * 1.5 + 1.2) * -Math.sin(eng.yaw)
          ),
          rotVel: new THREE.Vector3(Math.random() * 12, Math.random() * 12, Math.random() * 12)
        });
        return;
      }

      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const velocities = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        positions[i * 3] = pos.x + (Math.random() - 0.5) * 0.2;
        positions[i * 3 + 1] = pos.y + (Math.random() - 0.5) * 0.2;
        positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.2;

        const speed = type === 'fire' ? 6.5 : type === 'glass' ? 3.8 : 4.2;
        velocities[i * 3] = (Math.random() - 0.5) * speed;
        velocities[i * 3 + 1] = Math.random() * speed * 0.9 + 0.8;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * speed;
      }

      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const colorMap: Record<ParticleBurst['type'], number> = {
        sparks: 0xfbbf24,
        blood: 0xdc2626,
        glass: 0x7dd3fc,
        smoke: 0x94a3b8,
        fire: 0xf97316,
        shell: 0xfbbf24
      };

      const mat = new THREE.PointsMaterial({
        color: colorMap[type],
        size: type === 'smoke' ? 0.65 : type === 'fire' ? 0.45 : 0.14,
        transparent: true,
        opacity: 0.9
      });

      const points = new THREE.Points(geo, mat);
      eng.scene.add(points);
      eng.particles.push({
        mesh: points,
        velocities,
        createdAt: performance.now(),
        duration: type === 'smoke' ? 1800 : type === 'fire' ? 950 : 550,
        type
      });
    },
    []
  );

  // Trigger Explosions
  const triggerExplosion = useCallback(
    (center: THREE.Vector3, radius: number, maxDamage = 130) => {
      const eng = engineRef.current;
      if (!eng.scene || !eng.world) return;

      soundEngine.playExplosion(center);
      spawnParticleBurst(center, 'fire', 40);
      spawnParticleBurst(center.clone().add(new THREE.Vector3(0, 0.8, 0)), 'smoke', 32);

      const distToPlayer = eng.playerPos.distanceTo(center);
      if (distToPlayer < radius * 2.5) {
        eng.cameraShake = Math.min(0.65, eng.cameraShake + (1 - distToPlayer / (radius * 2.5)) * 0.55);
      }

      if (distToPlayer < radius * 0.85) {
        const diffDmgMult =
          settingsRef.current.difficulty === 'STORY'
            ? 0.35
            : settingsRef.current.difficulty === 'EASY'
            ? 0.55
            : settingsRef.current.difficulty === 'NORMAL'
            ? 1.0
            : 1.4;
        const pDmg = (1 - distToPlayer / (radius * 0.85)) * 45 * diffDmgMult;
        if (eng.armor > 0) {
          const absorbed = Math.min(eng.armor, pDmg * 0.7);
          eng.armor -= absorbed;
          eng.hp = Math.max(0, eng.hp - (pDmg - absorbed));
        } else {
          eng.hp = Math.max(0, eng.hp - pDmg);
        }
        eng.damageFlash = 0.75;
      }

      for (const win of eng.world.windows) {
        if (!win.broken && win.position.distanceTo(center) < radius * 1.2) {
          win.broken = true;
          win.mesh.visible = false;
          soundEngine.playGlassBreak(win.position);
          spawnParticleBurst(win.position, 'glass', 20);
        }
      }

      for (const crate of eng.world.crates) {
        if (!crate.destroyed && crate.position.distanceTo(center) < radius) {
          crate.destroyed = true;
          crate.mesh.visible = false;
          spawnParticleBurst(crate.position, 'sparks', 15);
        }
      }

      for (const enemy of eng.enemies) {
        if (enemy.state === 'DEAD') continue;
        const d = enemy.position.distanceTo(center);
        if (d < radius) {
          const dmg = (1 - d / radius) * maxDamage;
          enemy.hp -= dmg;
          enemy.state = 'COMBAT';
          if (enemy.hp <= 0) {
            enemy.state = 'DEAD';
            enemy.mesh.rotation.x = -Math.PI / 2;
            enemy.mesh.position.y = 0.25;
            if (enemy.laserLine) enemy.laserLine.visible = false;
            if (enemy.alertMarkerMesh) enemy.alertMarkerMesh.visible = false;
            eng.kills += 1;
          }
        }
      }
    },
    [spawnParticleBurst]
  );

  // Spawn Enemy Squads on the Bright Daylight Map
  const spawnMissionEnemies = useCallback((mission: MissionConfig) => {
    const eng = engineRef.current;
    if (!eng.scene) return;

    for (const old of eng.enemies) {
      eng.scene.remove(old.mesh);
    }
    eng.enemies = [];

    // Progressive Enemy Placement:
    // 1. Scout Patrol on Sunny Boulevard (2 enemies - easy introductory combat)
    // 2. Corporate Office Guards (3 enemies)
    // 3. Counterattack Squad in Industrial Courtyard (4-5 enemies)
    // 4. Extraction Perimeter Guards (3 enemies)
    const enemyList: {
      archetype: EnemyArchetype;
      pos: [number, number, number];
      patrol: [number, number, number][];
      district: number;
    }[] = [
      // Scout Patrol (Zone 1)
      {
        archetype: 'AGGRESSIVE',
        pos: [-4, 0, -8],
        patrol: [[-4, 0, -8], [4, 0, -8]],
        district: 1
      },
      {
        archetype: 'DEFENSIVE',
        pos: [5, 0, -20],
        patrol: [[5, 0, -20], [-2, 0, -22]],
        district: 1
      },

      // Corporate Office Complex (Zone 2)
      {
        archetype: 'DEFENSIVE',
        pos: [16, 0, -52],
        patrol: [[14, 0, -52], [22, 0, -52]],
        district: 2
      },
      {
        archetype: 'TACTICAL',
        pos: [20, 0, -68],
        patrol: [[20, 0, -68], [15, 0, -74]],
        district: 2
      },
      {
        archetype: 'SNIPER',
        pos: [-14.5, 5.2, -42],
        patrol: [[-14.5, 5.2, -42], [-14.5, 5.2, -32]],
        district: 2
      },

      // Industrial Courtyard & Substation (Zone 3)
      {
        archetype: 'AGGRESSIVE',
        pos: [-6, 0, -106],
        patrol: [[-6, 0, -106], [6, 0, -106]],
        district: 3
      },
      {
        archetype: 'HEAVY',
        pos: [0, 0, -122],
        patrol: [[-3, 0, -122], [3, 0, -122]],
        district: 3
      },
      {
        archetype: 'TACTICAL',
        pos: [8, 0, -126],
        patrol: [[8, 0, -126], [-8, 0, -126]],
        district: 3
      },

      // Extraction Helipad Guards (Zone 4)
      {
        archetype: 'DEFENSIVE',
        pos: [-7, 0, -162],
        patrol: [[-7, 0, -162], [7, 0, -162]],
        district: 4
      },
      {
        archetype: 'TACTICAL',
        pos: [6, 0, -172],
        patrol: [[6, 0, -172], [-6, 0, -172]],
        district: 4
      }
    ];

    if (mission.enemyCountMultiplier > 1.1) {
      enemyList.push({
        archetype: 'HEAVY',
        pos: [0, 0, -78],
        patrol: [[-3, 0, -78], [3, 0, -78]],
        district: 2
      });
    }

    enemyList.forEach((cfg, idx) => {
      const entity = createEnemyEntity(
        `enemy_${idx}`,
        cfg.archetype,
        new THREE.Vector3(...cfg.pos),
        cfg.patrol.map((p) => new THREE.Vector3(...p)),
        cfg.district
      );
      eng.scene!.add(entity.mesh);
      eng.enemies.push(entity);
    });
  }, []);

  // Save / Trigger Checkpoint
  const reachCheckpoint = useCallback((cpIdx: number) => {
    const eng = engineRef.current;
    if (!eng.world || cpIdx <= eng.currentCheckpointIdx) return;
    const cp = eng.world.checkpoints[cpIdx];
    if (!cp) return;

    eng.currentCheckpointIdx = cpIdx;
    eng.objectiveStep = Math.min(5, cp.objectiveIdx + 1);
    soundEngine.playCheckpointSound();
    eng.checkpointNoticeText = `КОНТРОЛЬНАЯ ТОЧКА СОХРАНЕНА: ${cp.title}`;
    eng.checkpointNoticeExpiresAt = performance.now() + 4500;

    // Restore bonus health and armor at checkpoints
    eng.hp = Math.min(eng.maxHp, eng.hp + 40);
    eng.armor = Math.min(eng.maxArmor, eng.armor + 35);
  }, []);

  // Respawn from Current Checkpoint (When dying or clicking Restart Checkpoint)
  const restartFromCheckpoint = useCallback(() => {
    const eng = engineRef.current;
    if (!eng.world) return;

    const cp = eng.world.checkpoints[eng.currentCheckpointIdx] || eng.world.checkpoints[0];
    eng.playerPos.copy(cp.position);
    eng.yaw = cp.yaw;
    eng.pitch = 0;
    eng.playerVel.set(0, 0, 0);

    // Full Health & Armor reset based on difficulty
    const diff = settingsRef.current.difficulty;
    const baseHp = diff === 'STORY' ? 250 : diff === 'EASY' ? 200 : diff === 'NORMAL' ? 150 : 100;
    const baseArmor = diff === 'STORY' ? 150 : diff === 'EASY' ? 100 : diff === 'NORMAL' ? 75 : 50;

    eng.hp = baseHp;
    eng.maxHp = baseHp;
    eng.armor = baseArmor;
    eng.maxArmor = baseArmor;

    eng.damageFlash = 0;
    eng.damageIndicators = [];
    eng.cameraShake = 0;
    eng.isFiring = false;
    eng.isReloading = false;

    // Replenish ammo in active magazine
    eng.weapons.forEach((w) => {
      const cfg = WEAPONS[w.id];
      w.currentMag = cfg.magSize;
    });

    // Reset companion near player
    if (eng.companion) {
      eng.companion.position.copy(cp.position).add(new THREE.Vector3(-2.5, 0, -2));
      eng.companion.mesh.position.copy(eng.companion.position);
    }

    soundEngine.setMusicMood('AMBIENT');
    setScreen('PLAYING');

    triggerRadio(
      'КАПИТАН ВЭНС',
      'НАПАРНИК',
      'Боец, восстановить позицию! Продолжаем выполнение задачи с контрольной точки.',
      4200
    );
  }, [triggerRadio]);

  // Start or Restart Full Mission
  const startMission = useCallback(
    (mission: MissionConfig) => {
      soundEngine.init();
      soundEngine.setAlarmSiren(false);
      soundEngine.setMusicMood('AMBIENT');

      const eng = engineRef.current;
      const prog = progressionRef.current;
      const diff = settingsRef.current.difficulty;

      const baseHp = diff === 'STORY' ? 250 : diff === 'EASY' ? 200 : diff === 'NORMAL' ? 150 : 100;
      const baseArmor = diff === 'STORY' ? 150 : diff === 'EASY' ? 100 : diff === 'NORMAL' ? 75 : 50;

      // Spawn player on FOB Alpha!
      eng.playerPos.set(0, 1.7, 52);
      eng.initialPosition.set(0, 1.7, 52);
      eng.playerVel.set(0, 0, 0);
      eng.yaw = 0;
      eng.pitch = 0;
      eng.hp = baseHp;
      eng.maxHp = baseHp;
      eng.armor = baseArmor;
      eng.maxArmor = baseArmor;
      eng.damageFlash = 0;
      eng.damageIndicators = [];
      eng.cameraShake = 0;
      eng.kills = 0;
      eng.headshots = 0;
      eng.missionStartTime = performance.now();

      // Objectives & Tutorial reset
      eng.currentCheckpointIdx = 0;
      eng.objectiveStep = 1;
      eng.tutorialStep = 0;
      eng.tutorialActive = true;
      eng.tutorialCompleted = false;
      eng.initialDistanceMoved = 0;
      eng.scoutPatrolEliminated = false;
      eng.dataDriveSecured = false;
      eng.counterattackTriggered = false;
      eng.counterattackEliminated = false;
      eng.extractionStarted = false;
      eng.tacticalChoice = 'NONE';
      eng.showChoiceModal = false;
      eng.extractionTimer = null;

      // Build Arsenal
      const orderedIds: WeaponId[] = [
        prog.primaryWeapon,
        ...prog.unlockedWeapons.filter((id) => id !== prog.primaryWeapon)
      ];
      eng.weapons = orderedIds.map((id) => {
        const w = WEAPONS[id];
        const ext = prog.attachments[id]?.magazine === 'extended';
        const mag = ext ? Math.round(w.magSize * 1.35) : w.magSize;
        return {
          id,
          currentMag: mag,
          reserveAmmo: w.maxReserve
        };
      });
      eng.currentWeaponIdx = 0;

      if (eng.weaponRig) {
        const wId = eng.weapons[0].id;
        eng.weaponRig.buildWeaponModel(wId, prog.attachments[wId]);
      }

      eng.grenades = { frag: 3, smoke: 2, flash: 2 };
      eng.selectedGrenade = 'frag';

      // Reset dynamic world items
      if (eng.world) {
        eng.world.windows.forEach((w) => {
          w.broken = false;
          w.mesh.visible = true;
        });
        eng.world.crates.forEach((c) => {
          c.destroyed = false;
          c.mesh.visible = true;
          c.hp = 45;
        });
        eng.world.explosives.forEach((ex) => {
          ex.exploded = false;
          ex.mesh.visible = true;
          ex.hp = ex.type === 'car' ? 120 : 40;
        });
        eng.world.ammoPickups.forEach((a) => {
          a.collected = false;
          a.mesh.visible = true;
        });
        eng.world.medkitPickups.forEach((m) => {
          m.collected = false;
          m.mesh.visible = true;
        });
        eng.world.armorPickups.forEach((ar) => {
          ar.collected = false;
          ar.mesh.visible = true;
        });
        eng.world.doors.forEach((d) => {
          d.isOpen = false;
          d.mesh.position.copy(d.closedPos);
        });
        eng.world.extractionHelicopter.visible = false;
        eng.world.extractionHelicopter.position.set(0, 22, -220);
      }

      // Companion Captain Vance placement
      if (eng.companion) {
        eng.companion.position.set(-2.5, 0, 50);
        eng.companion.mesh.position.copy(eng.companion.position);
      }

      spawnMissionEnemies(mission);
      setScreen('PLAYING');

      triggerRadio(
        'КАПИТАН ВЭНС',
        'КОМАНДИР ГРУППЫ',
        'Боец, добро пожаловать в Black Strike. Ознакомься с управлением и выдвигайся к воротам КПП на севере. Я прикрою тебя.',
        7000
      );
    },
    [spawnMissionEnemies, triggerRadio]
  );

  // Skip Tutorial Handler
  const skipTutorial = useCallback(() => {
    const eng = engineRef.current;
    eng.tutorialActive = false;
    eng.tutorialCompleted = true;
    if (eng.world) {
      eng.world.outpostGate.isOpen = true;
    }
    reachCheckpoint(1);
    triggerRadio(
      'КАПИТАН ВЭНС',
      'КОМАНДИР',
      'Отлично, ворота КПП открыты! Выходим на Центральный проспект. Впереди зафиксирован вражеский дозор.',
      5000
    );
  }, [reachCheckpoint, triggerRadio]);

  // Handle Tactical Choice Substation
  const handleSelectTacticalChoice = useCallback(
    (choice: TacticalChoiceOption) => {
      const eng = engineRef.current;
      if (eng.tacticalChoice !== 'NONE') return;
      eng.tacticalChoice = choice;
      eng.showChoiceModal = false;

      if (choice === 'DESTROY_GENERATOR') {
        if (eng.world) {
          const gen = eng.world.explosives.find((e) => e.id === 'main_generator');
          if (gen && !gen.exploded) {
            gen.exploded = true;
            triggerExplosion(gen.position, 12, 160);
          }
        }
        triggerRadio(
          'КАПИТАН ВЭНС',
          'НАПАРНИК',
          'Генератор взорван! Защитные системы отключены, прорываемся к посадочной площадке!',
          5000
        );
      } else {
        soundEngine.playUiClick();
        triggerRadio(
          'КАПИТАН ВЭНС',
          'НАПАРНИК',
          'Сигнализация успешно взломана! Вражеские турели заблокированы. Вперёд к вертолёту!',
          5000
        );
      }
    },
    [triggerExplosion, triggerRadio]
  );

  // Reload handler
  const triggerReload = useCallback(() => {
    const eng = engineRef.current;
    if (eng.isReloading) return;
    const wState = eng.weapons[eng.currentWeaponIdx];
    if (!wState) return;
    const wCfg = WEAPONS[wState.id];
    const ext = progressionRef.current.attachments[wState.id]?.magazine === 'extended';
    const maxMag = ext ? Math.round(wCfg.magSize * 1.35) : wCfg.magSize;

    if (wState.currentMag >= maxMag || wState.reserveAmmo <= 0) return;

    eng.isReloading = true;
    eng.isAds = false;
    eng.reloadEndTime = performance.now() + wCfg.reloadTimeMs;
    soundEngine.playReloadSound();

    // Advance tutorial step if on shooting tutorial
    if (eng.tutorialActive && eng.tutorialStep === 2) {
      eng.tutorialStep = 3;
    }
  }, []);

  // Throw Grenade handler
  const triggerThrowGrenade = useCallback(() => {
    const eng = engineRef.current;
    if (!eng.scene || !eng.camera) return;
    const gType = eng.selectedGrenade;
    if (eng.grenades[gType] <= 0) return;

    eng.grenades[gType] -= 1;
    soundEngine.playMechanicalClick(0, 820, 0.05);

    const gColor = gType === 'frag' ? 0x15803d : gType === 'smoke' ? 0x64748b : 0xfbbf24;
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.16, 10),
      new THREE.MeshStandardMaterial({ color: gColor, metalness: 0.6, roughness: 0.4 })
    );

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(eng.camera.quaternion);
    const startPos = eng.playerPos.clone().addScaledVector(forward, 0.8);
    mesh.position.copy(startPos);
    eng.scene.add(mesh);

    eng.activeGrenades.push({
      id: `gren_${Date.now()}`,
      type: gType,
      mesh,
      position: startPos,
      velocity: forward.multiplyScalar(18).add(new THREE.Vector3(0, 4.5, 0)),
      timer: 2.1,
      isEnemy: false
    });
  }, []);

  // Context Interact handler [E]
  const triggerInteract = useCallback(() => {
    const eng = engineRef.current;
    if (!eng.world) return;

    // 1. Check Outpost Checkpoint Gate (Tutorial completion)
    if (
      eng.playerPos.distanceTo(eng.world.outpostGate.closedPos) < 7.0 &&
      !eng.world.outpostGate.isOpen
    ) {
      eng.world.outpostGate.isOpen = true;
      soundEngine.playReloadSound();
      eng.tutorialActive = false;
      eng.tutorialCompleted = true;
      reachCheckpoint(1);
      triggerRadio(
        'КАПИТАН ВЭНС',
        'КОМАНДИР',
        'Ворота открыты! Мы выходим в город. Внимание: впереди на проспекте обнаружен дозор противника.',
        5500
      );
      return;
    }

    // 2. Check Other Interactive Doors
    for (const door of eng.world.doors) {
      if (eng.playerPos.distanceTo(door.closedPos) < 5.2) {
        door.isOpen = !door.isOpen;
        soundEngine.playReloadSound();
        return;
      }
    }

    // 3. Check Classified Data Drive in Office Server Room
    if (
      !eng.dataDriveSecured &&
      eng.playerPos.distanceTo(eng.world.dataDrivePos) < 5.5
    ) {
      eng.dataDriveSecured = true;
      soundEngine.playObjectiveComplete();
      reachCheckpoint(3);
      eng.objectiveStep = 4;
      triggerRadio(
        'КАПИТАН ВЭНС',
        'НАПАРНИК',
        'Диск данных успешно скопирован! Тревога: отряд Кронос перекрыл выход во дворе. Прорываемся через склад к вертолёту!',
        6500
      );
      return;
    }

    // 4. Check Tactical Choice Substation
    if (
      eng.tacticalChoice === 'NONE' &&
      (eng.playerPos.distanceTo(eng.world.generatorPos) < 7.5 ||
        eng.playerPos.distanceTo(eng.world.alarmTerminalPos) < 7.5)
    ) {
      eng.showChoiceModal = true;
      if (document.pointerLockElement) document.exitPointerLock();
      return;
    }
  }, [reachCheckpoint, triggerRadio]);

  // Main Three.js Scene, Lighting, Physics & Animation Setup
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();

    // BRIGHT DAYLIGHT SKY & ATMOSPHERE
    scene.background = new THREE.Color(0x93c5fd); // Clear blue daytime sky!
    scene.fog = new THREE.FogExp2(0x93c5fd, 0.0035); // Soft, realistic atmospheric falloff!

    const camera = new THREE.PerspectiveCamera(
      settingsRef.current.fov,
      window.innerWidth / window.innerHeight,
      0.08,
      350
    );
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15; // Bright, natural exposure!
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Hemispheric natural sky light
    const ambientLight = new THREE.HemisphereLight(0xbfdbfe, 0xe2e8f0, 1.4);
    scene.add(ambientLight);

    // Build World (FOB Alpha Staging, Sunny Boulevard, Office Complex, Helipad)
    const world = buildGameWorld(scene);

    // Build Companion (Captain Vance)
    const companion = createCompanionEntity(new THREE.Vector3(-2.5, 0, 50));
    scene.add(companion.mesh);

    // First-Person Weapon Rig
    const weaponRig = new FirstPersonWeaponRig();
    camera.add(weaponRig.root);
    weaponRig.buildWeaponModel(
      progressionRef.current.primaryWeapon,
      progressionRef.current.attachments[progressionRef.current.primaryWeapon]
    );

    const eng = engineRef.current;
    eng.scene = scene;
    eng.camera = camera;
    eng.renderer = renderer;
    eng.world = world;
    eng.companion = companion;
    eng.weaponRig = weaponRig;
    eng.ambientLight = ambientLight;

    // Window Resize
    const handleResize = () => {
      if (!eng.camera || !eng.renderer) return;
      eng.camera.aspect = window.innerWidth / window.innerHeight;
      eng.camera.updateProjectionMatrix();
      eng.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // PointerLock
    const handlePointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement === renderer.domElement);
    };
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    // Mouse Look with Invert Y support
    const handleMouseMove = (e: MouseEvent) => {
      if (screenRef.current !== 'PLAYING') return;
      if (document.pointerLockElement !== renderer.domElement) return;

      const sens = 0.0022 * settingsRef.current.sensitivity * (eng.isAds ? 0.55 : 1.0);
      const dy = settingsRef.current.invertY ? e.movementY : -e.movementY;

      eng.yaw -= e.movementX * sens;
      eng.pitch = THREE.MathUtils.clamp(
        eng.pitch + dy * sens,
        -Math.PI / 2.15,
        Math.PI / 2.15
      );
      eng.weaponRig?.addLookSway(e.movementX * 0.002, e.movementY * 0.002);
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleMouseDown = (e: MouseEvent) => {
      if (screenRef.current !== 'PLAYING' || eng.showChoiceModal) return;
      if (document.pointerLockElement !== renderer.domElement) return;
      if (e.button === 0) {
        eng.isFiring = true;
      } else if (e.button === 2) {
        eng.isAds = !eng.isAds;
        if (eng.tutorialActive && eng.tutorialStep === 2) {
          // Advance tutorial
          eng.tutorialStep = 3;
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) eng.isFiring = false;
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (screenRef.current === 'PLAYING') e.preventDefault();
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      eng.keys[code] = true;

      if (screenRef.current !== 'PLAYING') return;

      if (code === 'Escape') {
        if (document.pointerLockElement) document.exitPointerLock();
        setScreen('PAUSED');
        return;
      }

      if (eng.showChoiceModal) {
        if (code === 'Digit1') handleSelectTacticalChoice('DESTROY_GENERATOR');
        if (code === 'Digit2') handleSelectTacticalChoice('DISABLE_ALARM');
        return;
      }

      if (code === 'KeyR') triggerReload();
      if (code === 'KeyG') triggerThrowGrenade();
      if (code === 'KeyE') triggerInteract();
      if (code === 'KeyC' || code === 'ControlLeft') {
        eng.isCrouching = !eng.isCrouching;
      }
      if (code === 'KeyQ') {
        const order: GrenadeType[] = ['frag', 'smoke', 'flash'];
        const nextIdx = (order.indexOf(eng.selectedGrenade) + 1) % order.length;
        eng.selectedGrenade = order[nextIdx];
      }
      if (code === 'Space' && eng.onGround) {
        eng.playerVel.y = 6.8;
        eng.onGround = false;
        eng.isCrouching = false;
        if (eng.tutorialActive && eng.tutorialStep === 1) {
          eng.tutorialStep = 2;
        }
      }

      // Weapon Slots 1-5
      const slotMap: Record<string, number> = {
        Digit1: 0,
        Digit2: 1,
        Digit3: 2,
        Digit4: 3,
        Digit5: 4
      };
      if (code in slotMap) {
        const idx = slotMap[code];
        if (idx < eng.weapons.length && idx !== eng.currentWeaponIdx) {
          eng.currentWeaponIdx = idx;
          eng.isReloading = false;
          eng.isAds = false;
          const wId = eng.weapons[idx].id;
          eng.weaponRig?.buildWeaponModel(wId, progressionRef.current.attachments[wId]);
          soundEngine.playMechanicalClick(0, 980, 0.06);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      eng.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Raycaster for shooting & AI line of sight
    const raycaster = new THREE.Raycaster();
    let lastFrameTime = performance.now();
    let lastHudSync = 0;
    let animFrameId = 0;

    // Player Shooting Logic
    const executePlayerShot = (now: number) => {
      const wState = eng.weapons[eng.currentWeaponIdx];
      if (!wState) return;
      const wCfg = WEAPONS[wState.id];
      const att = progressionRef.current.attachments[wState.id];

      if (now - eng.lastShotTime < wCfg.fireRateMs) return;
      if (wState.currentMag <= 0) {
        triggerReload();
        return;
      }

      eng.lastShotTime = now;
      wState.currentMag -= 1;

      const recoilMult = att.muzzle === 'compensator' || att.muzzle === 'suppressor' ? 0.72 : 1.0;
      soundEngine.playWeaponFire(wCfg.id, att.muzzle === 'suppressor');
      eng.weaponRig?.triggerFire(wCfg.recoilVertical * recoilMult);

      // Shell casing
      const ejectWorld = eng.playerPos
        .clone()
        .add(new THREE.Vector3(0.2, -0.1, -0.3).applyQuaternion(camera.quaternion));
      spawnParticleBurst(ejectWorld, 'shell', 1);

      // Camera recoil kick
      eng.pitch = Math.min(
        Math.PI / 2.15,
        eng.pitch + wCfg.recoilVertical * recoilMult * (eng.isAds ? 0.65 : 1.0)
      );
      eng.yaw += (Math.random() - 0.5) * wCfg.recoilHorizontal * recoilMult * 2;

      // Base spread
      const baseSpread = eng.isAds ? wCfg.spreadAds : wCfg.spreadHip;

      for (let p = 0; p < wCfg.pellets; p++) {
        const spreadX = (Math.random() - 0.5) * baseSpread;
        const spreadY = (Math.random() - 0.5) * baseSpread;
        raycaster.setFromCamera(new THREE.Vector2(spreadX, spreadY), camera);
        raycaster.far = wCfg.range;

        const targets: THREE.Object3D[] = [];
        eng.enemies.forEach((e) => {
          if (e.state !== 'DEAD') {
            targets.push(
              e.headMesh,
              e.bodyMesh,
              e.leftArmMesh,
              e.rightArmMesh,
              e.leftLegMesh,
              e.rightLegMesh
            );
          }
        });
        world.windows.forEach((w) => {
          if (!w.broken) targets.push(w.mesh);
        });
        world.crates.forEach((c) => {
          if (!c.destroyed) targets.push(c.mesh);
        });
        world.explosives.forEach((ex) => {
          if (!ex.exploded) targets.push(ex.mesh);
        });
        targets.push(world.worldGroup);

        const hits = raycaster.intersectObjects(targets, true);
        const validHit = hits.find(
          (h) => !weaponRig.root.getObjectById(h.object.id) && h.distance > 0.4
        );

        if (!validHit) continue;

        const hitPos = validHit.point;
        const hitObj = validHit.object;

        // Enemy Hit
        const enemyId = hitObj.userData?.enemyId;
        const hitZone = hitObj.userData?.hitZone as HitZone | undefined;

        if (enemyId && hitZone) {
          const enemy = eng.enemies.find((e) => e.id === enemyId);
          if (enemy && enemy.state !== 'DEAD') {
            const mult = hitZone === 'HEAD' ? 2.5 : hitZone === 'BODY' ? 1.0 : 0.7;
            let dmg = wCfg.damage * mult;

            if (enemy.armor > 0 && hitZone === 'BODY') {
              const absorbed = Math.min(enemy.armor, dmg * 0.5);
              enemy.armor -= absorbed;
              dmg -= absorbed * 0.5;
            }

            enemy.hp -= dmg;
            enemy.state = 'COMBAT';

            if (hitZone === 'LEGS' && !enemy.legDamaged) {
              enemy.legDamaged = true;
              enemy.speed = enemy.baseSpeed * 0.5;
            }

            const killed = enemy.hp <= 0;
            if (killed) {
              enemy.state = 'DEAD';
              enemy.mesh.rotation.x = -Math.PI / 2;
              enemy.mesh.position.y = 0.25;
              if (enemy.laserLine) enemy.laserLine.visible = false;
              if (enemy.alertMarkerMesh) enemy.alertMarkerMesh.visible = false;
              eng.kills += 1;
              if (hitZone === 'HEAD') eng.headshots += 1;

              // Check if Scout Patrol is defeated (Objective 2)
              const aliveScouts = eng.enemies.filter(
                (e) => e.district === 1 && e.state !== 'DEAD'
              ).length;
              if (aliveScouts === 0 && !eng.scoutPatrolEliminated) {
                eng.scoutPatrolEliminated = true;
                reachCheckpoint(2);
                soundEngine.playObjectiveComplete();
                triggerRadio(
                  'КАПИТАН ВЭНС',
                  'НАПАРНИК',
                  'Дозор ликвидирован! Путь к офисному комплексу свободен. Проникаем внутрь за диском данных.',
                  5500
                );
              }
            }

            soundEngine.playHitMarker(hitZone === 'HEAD');
            spawnParticleBurst(hitPos, hitZone === 'HEAD' ? 'sparks' : 'blood', 12);

            setHudState((prev) => ({
              ...prev,
              hitMarker: {
                active: true,
                zone: hitZone,
                killed,
                timestamp: now
              }
            }));
            continue;
          }
        }

        // Window Shatter
        const hitWin = world.windows.find((w) => !w.broken && w.mesh === hitObj);
        if (hitWin) {
          hitWin.broken = true;
          hitWin.mesh.visible = false;
          soundEngine.playGlassBreak(hitPos);
          spawnParticleBurst(hitPos, 'glass', 24);
          continue;
        }

        // Crate Damage
        const hitCrate = world.crates.find((c) => !c.destroyed && c.mesh === hitObj);
        if (hitCrate) {
          hitCrate.hp -= wCfg.damage;
          spawnParticleBurst(hitPos, 'sparks', 8);
          if (hitCrate.hp <= 0) {
            hitCrate.destroyed = true;
            hitCrate.mesh.visible = false;
            spawnParticleBurst(hitCrate.position, 'smoke', 16);
          }
          continue;
        }

        // Explosives
        const hitExp = world.explosives.find(
          (ex) => !ex.exploded && (ex.mesh === hitObj || ex.mesh.children.includes(hitObj))
        );
        if (hitExp) {
          hitExp.hp -= wCfg.damage;
          spawnParticleBurst(hitPos, 'sparks', 12);
          if (hitExp.hp <= 0) {
            hitExp.exploded = true;
            if (hitExp.id === 'main_generator' && eng.tacticalChoice === 'NONE') {
              handleSelectTacticalChoice('DESTROY_GENERATOR');
            } else {
              if (hitExp.type === 'barrel') hitExp.mesh.visible = false;
              triggerExplosion(hitExp.position, hitExp.radius, 140);
            }
          }
          continue;
        }

        // Bullet impact on wall/ground
        spawnParticleBurst(hitPos, 'sparks', 6);
      }
    };

    // 60FPS Game Loop
    const animate = (now: number) => {
      animFrameId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
      lastFrameTime = now;
      const timeSec = now * 0.001;

      // In Menu Screens, render 3D Daylight Staging Scene at (85, 0, 85)
      if (screenRef.current !== 'PLAYING') {
        weaponRig.root.visible = false;
        camera.position.set(85 + Math.sin(timeSec * 0.25) * 0.5, 1.6, 88.8);
        camera.lookAt(85.3, 1.35, 85);
        world.menuOperatorGroup.position.y = Math.sin(timeSec * 1.6) * 0.015;
        renderer.render(scene, camera);
        return;
      }

      weaponRig.root.visible = true;

      // Reload completion
      if (eng.isReloading && now >= eng.reloadEndTime) {
        eng.isReloading = false;
        const wState = eng.weapons[eng.currentWeaponIdx];
        if (wState) {
          const wCfg = WEAPONS[wState.id];
          const ext = progressionRef.current.attachments[wState.id]?.magazine === 'extended';
          const maxMag = ext ? Math.round(wCfg.magSize * 1.35) : wCfg.magSize;
          const needed = maxMag - wState.currentMag;
          const taken = Math.min(needed, wState.reserveAmmo);
          wState.currentMag += taken;
          wState.reserveAmmo -= taken;
        }
      }

      // Firing
      if (eng.isFiring && !eng.isReloading && !eng.showChoiceModal) {
        executePlayerShot(now);
      }

      // Smooth FOV
      const currentW = WEAPONS[eng.weapons[eng.currentWeaponIdx]?.id || 'assault_rifle'];
      const targetFov = eng.isAds
        ? currentW.adsFov
        : eng.isSprinting
        ? settingsRef.current.fov + 6
        : settingsRef.current.fov;
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, Math.min(1, dt * 12));
      camera.updateProjectionMatrix();

      // Player Movement
      let moveForward = 0;
      let moveRight = 0;
      if (eng.keys['KeyW'] || eng.keys['ArrowUp']) moveForward += 1;
      if (eng.keys['KeyS'] || eng.keys['ArrowDown']) moveForward -= 1;
      if (eng.keys['KeyD'] || eng.keys['ArrowRight']) moveRight += 1;
      if (eng.keys['KeyA'] || eng.keys['ArrowLeft']) moveRight -= 1;

      if (Math.abs(eng.touchMove.x) > 0.05 || Math.abs(eng.touchMove.y) > 0.05) {
        moveRight += eng.touchMove.x;
        moveForward += eng.touchMove.y;
      }

      const isMoving = Math.hypot(moveForward, moveRight) > 0.1;
      eng.isSprinting =
        isMoving &&
        !eng.isAds &&
        !eng.isCrouching &&
        (Boolean(eng.keys['ShiftLeft']) || Boolean(eng.keys['ShiftRight']) || eng.touchMove.sprint);

      // Track movement for tutorial Step 0
      if (eng.tutorialActive && eng.tutorialStep === 0 && isMoving) {
        eng.initialDistanceMoved += dt * 4;
        if (eng.initialDistanceMoved > 3.0) {
          eng.tutorialStep = 1;
        }
      }

      const baseSpeed = eng.isCrouching ? 4.2 : eng.isSprinting ? 10.6 : eng.isAds ? 4.8 : 7.2;
      const forwardDir = new THREE.Vector3(-Math.sin(eng.yaw), 0, -Math.cos(eng.yaw));
      const rightDir = new THREE.Vector3(Math.cos(eng.yaw), 0, -Math.sin(eng.yaw));

      const wishDir = new THREE.Vector3()
        .addScaledVector(forwardDir, moveForward)
        .addScaledVector(rightDir, moveRight);
      if (wishDir.lengthSq() > 1) wishDir.normalize();

      const nextX = eng.playerPos.x + wishDir.x * baseSpeed * dt;
      const nextZ = eng.playerPos.z + wishDir.z * baseSpeed * dt;
      const eyeHeight = eng.isCrouching ? 1.05 : 1.7;

      // Roof / Stairs Elevation support for Route D
      let groundElevation = 0;
      for (const roof of world.walkableRoofs) {
        if (
          nextX >= roof.box.min.x - 0.35 &&
          nextX <= roof.box.max.x + 0.35 &&
          nextZ >= roof.box.min.z - 0.35 &&
          nextZ <= roof.box.max.z + 0.35 &&
          eng.playerPos.y - eyeHeight >= roof.topY - 1.35
        ) {
          groundElevation = Math.max(groundElevation, roof.topY);
        }
      }

      // Box Collision
      const checkCollision = (testX: number, testZ: number) => {
        const feetY = eng.playerPos.y - eyeHeight;
        const playerBox = new THREE.Box3(
          new THREE.Vector3(testX - 0.42, feetY + 0.65, testZ - 0.42),
          new THREE.Vector3(testX + 0.42, feetY + eyeHeight, testZ + 0.42)
        );
        for (const box of world.colliders) {
          if (playerBox.intersectsBox(box)) return true;
        }
        for (const door of world.doors) {
          if (!door.isOpen && playerBox.intersectsBox(door.box)) return true;
        }
        return false;
      };

      if (!checkCollision(nextX, eng.playerPos.z)) eng.playerPos.x = nextX;
      if (!checkCollision(eng.playerPos.x, nextZ)) eng.playerPos.z = nextZ;

      // Gravity & Grounding
      eng.playerVel.y -= 18.5 * dt;
      eng.playerPos.y += eng.playerVel.y * dt;
      const targetEyeY = groundElevation + eyeHeight;
      if (eng.playerPos.y <= targetEyeY) {
        eng.playerPos.y = THREE.MathUtils.lerp(eng.playerPos.y, targetEyeY, Math.min(1, dt * 18));
        eng.playerVel.y = 0;
        eng.onGround = true;
      }

      // Footstep audio
      if (isMoving && eng.onGround) {
        const stepInterval = eng.isSprinting ? 290 : 440;
        if (now - eng.lastFootstepTime > stepInterval) {
          eng.lastFootstepTime = now;
          soundEngine.playFootstep('concrete', eng.isSprinting);
        }
      }

      // Camera orientation & shake
      eng.cameraShake = THREE.MathUtils.lerp(eng.cameraShake, 0, Math.min(1, dt * 8));
      const shakeX = (Math.random() - 0.5) * eng.cameraShake * 0.15;
      const shakeY = (Math.random() - 0.5) * eng.cameraShake * 0.15;

      camera.position.copy(eng.playerPos);
      const euler = new THREE.Euler(eng.pitch + shakeY, eng.yaw + shakeX, 0, 'YXZ');
      camera.quaternion.setFromEuler(euler);

      soundEngine.updateListener(
        eng.playerPos,
        new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion),
        new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion)
      );

      // Weapon rig animation
      weaponRig.update(
        dt,
        timeSec,
        isMoving,
        eng.isSprinting,
        eng.isAds,
        eng.isReloading,
        eng.weapons[eng.currentWeaponIdx]?.id || 'assault_rifle'
      );

      // Animate Doors
      for (const door of world.doors) {
        const target = door.isOpen ? door.openPos : door.closedPos;
        door.mesh.position.lerp(target, Math.min(1, dt * 6));
      }

      // Pickups: Medkits (+50 HP)
      for (const kit of world.medkitPickups) {
        if (!kit.collected && eng.playerPos.distanceTo(kit.position) < 2.4) {
          if (eng.hp < eng.maxHp) {
            kit.collected = true;
            kit.mesh.visible = false;
            eng.hp = Math.min(eng.maxHp, eng.hp + kit.healAmount);
            soundEngine.playMedkit();
          }
        }
      }

      // Pickups: Armor Plates (+50 Armor)
      for (const arm of world.armorPickups) {
        if (!arm.collected && eng.playerPos.distanceTo(arm.position) < 2.4) {
          if (eng.armor < eng.maxArmor) {
            arm.collected = true;
            arm.mesh.visible = false;
            eng.armor = Math.min(eng.maxArmor, eng.armor + arm.armorAmount);
            soundEngine.playArmorPickup();
          }
        }
      }

      // Pickups: Ammo Caches
      for (const pickup of world.ammoPickups) {
        if (!pickup.collected && eng.playerPos.distanceTo(pickup.position) < 2.4) {
          pickup.collected = true;
          pickup.mesh.visible = false;
          soundEngine.playReloadSound();
          eng.weapons.forEach((w) => {
            const cfg = WEAPONS[w.id];
            w.reserveAmmo = Math.min(
              cfg.maxReserve,
              w.reserveAmmo + Math.ceil(cfg.magSize * pickup.amountFactor * 2)
            );
          });
        }
      }

      // Check Checkpoints as player advances
      if (eng.playerPos.z < 22 && eng.currentCheckpointIdx < 1) reachCheckpoint(1);
      if (eng.playerPos.z < -35 && eng.currentCheckpointIdx < 2) reachCheckpoint(2);
      if (eng.playerPos.z < -90 && eng.currentCheckpointIdx < 3 && eng.dataDriveSecured) {
        reachCheckpoint(3);
      }
      if (eng.playerPos.z < -145 && eng.currentCheckpointIdx < 4) reachCheckpoint(4);

      // Helipad Extraction Check
      if (world.extractionHelicopter.visible) {
        world.extractionHelicopter.position.lerp(
          new THREE.Vector3(0, 0.3, -182),
          Math.min(1, dt * 0.9)
        );
        world.helicopterRotors.forEach((r) => {
          r.rotation.y += dt * 18;
        });

        if (eng.playerPos.distanceTo(new THREE.Vector3(0, 1.5, -182)) < 7.5) {
          soundEngine.setAlarmSiren(false);
          soundEngine.setMusicMood('VICTORY');
          if (document.pointerLockElement) document.exitPointerLock();

          const currentMission =
            MISSIONS.find((m) => m.id === selectedMissionId) || MISSIONS[0];
          const timeSecs = Math.round((performance.now() - eng.missionStartTime) / 1000);
          const earnedXp = currentMission.xpReward + eng.kills * 25 + eng.headshots * 15;

          setLastMissionStats({
            kills: eng.kills,
            headshots: eng.headshots,
            xpEarned: earnedXp,
            choice: eng.tacticalChoice,
            timeSeconds: timeSecs
          });

          setProgression((prev) => ({
            ...prev,
            xp: prev.xp + earnedXp,
            level: prev.level + 1,
            missionsCompleted: Array.from(new Set([...prev.missionsCompleted, currentMission.id]))
          }));

          setScreen('VICTORY');
          return;
        }
      }

      // Helicopter Arrival Trigger when reaching extraction zone
      if (eng.dataDriveSecured && eng.playerPos.z < -135 && !eng.extractionStarted) {
        eng.extractionStarted = true;
        eng.objectiveStep = 5;
        world.extractionHelicopter.visible = true;
        soundEngine.setMusicMood('FINALE');
        triggerRadio(
          'RAVEN-1 (ПИЛОТ)',
          'ЭВАКУАЦИЯ',
          'Борт RAVEN-1 заходит на посадку на вертолётную площадку! Поднимайтесь на борт!',
          6500
        );
      }

      // ======================================================================
      // SMART, FAIR ENEMY AI WITH DETECTION DELAY & AUDIO STING
      // ======================================================================
      const diff = settingsRef.current.difficulty;
      const reactionDelayMax =
        diff === 'STORY' ? 1.4 : diff === 'EASY' ? 1.0 : diff === 'NORMAL' ? 0.65 : 0.35;
      const hitChanceBase =
        diff === 'STORY' ? 0.2 : diff === 'EASY' ? 0.32 : diff === 'NORMAL' ? 0.5 : 0.75;
      const dmgMultiplier =
        diff === 'STORY' ? 0.35 : diff === 'EASY' ? 0.55 : diff === 'NORMAL' ? 1.0 : 1.4;

      for (const enemy of eng.enemies) {
        if (enemy.state === 'DEAD') continue;

        if (enemy.stunTimer > 0) {
          enemy.stunTimer -= dt;
          if (enemy.stunTimer <= 0) enemy.state = 'COMBAT';
          continue;
        }

        const distToPlayer = enemy.position.distanceTo(eng.playerPos);

        // Line-of-sight raycast check (Do not see or shoot through solid walls!)
        let hasLineOfSight = false;
        if (distToPlayer < 45) {
          const eyeEnemy = enemy.position.clone().add(new THREE.Vector3(0, 1.5, 0));
          const toPlayerRay = eng.playerPos.clone().sub(eyeEnemy).normalize();
          raycaster.set(eyeEnemy, toPlayerRay);
          raycaster.far = distToPlayer + 0.5;

          const collCheck = raycaster.intersectObjects(world.colliders.map((c) => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(
              c.max.x - c.min.x,
              c.max.y - c.min.y,
              c.max.z - c.min.z
            ));
            m.position.set(
              (c.min.x + c.max.x) / 2,
              (c.min.y + c.max.y) / 2,
              (c.min.z + c.max.z) / 2
            );
            return m;
          }), false);

          hasLineOfSight = collCheck.length === 0;
        }

        // Detection & Grace Period Alert
        if (hasLineOfSight && distToPlayer < 38) {
          if (enemy.state === 'PATROL') {
            enemy.state = 'ALERT';
            enemy.alertDelayTimer = reactionDelayMax;
            if (enemy.alertMarkerMesh) enemy.alertMarkerMesh.visible = true;
            soundEngine.playAlertSting();
          }
        } else if (!hasLineOfSight && enemy.state === 'ALERT') {
          // Lost sight before opening fire
          enemy.state = 'PATROL';
          if (enemy.alertMarkerMesh) enemy.alertMarkerMesh.visible = false;
        }

        // Countdown detection delay timer
        if (enemy.state === 'ALERT') {
          enemy.alertDelayTimer -= dt;
          enemy.mesh.lookAt(eng.playerPos.x, enemy.position.y, eng.playerPos.z);
          if (enemy.alertDelayTimer <= 0) {
            enemy.state = 'COMBAT';
            if (enemy.alertMarkerMesh) enemy.alertMarkerMesh.visible = false;
          }
        }

        // Patrol Movement
        if (enemy.state === 'PATROL' && enemy.patrolPoints.length > 0) {
          const wp = enemy.patrolPoints[enemy.currentPatrolIdx];
          const dir = wp.clone().sub(enemy.position);
          dir.y = 0;
          if (dir.length() < 0.8) {
            enemy.currentPatrolIdx = (enemy.currentPatrolIdx + 1) % enemy.patrolPoints.length;
          } else {
            dir.normalize();
            enemy.position.addScaledVector(dir, enemy.speed * 0.45 * dt);
            enemy.mesh.position.copy(enemy.position);
            enemy.mesh.lookAt(wp.x, enemy.position.y, wp.z);
          }
        } else if (enemy.state === 'COMBAT') {
          enemy.mesh.lookAt(eng.playerPos.x, enemy.position.y, eng.playerPos.z);

          // Tactical spacing
          const toPlayer = eng.playerPos.clone().sub(enemy.position);
          toPlayer.y = 0;
          const flatDist = toPlayer.length();
          if (flatDist > 0.1) toPlayer.normalize();

          if (enemy.archetype === 'AGGRESSIVE' && flatDist > 8.0) {
            enemy.position.addScaledVector(toPlayer, enemy.speed * dt);
          } else if (enemy.hp < 30 && flatDist < 16) {
            enemy.position.addScaledVector(toPlayer, -enemy.speed * 0.7 * dt);
          }
          enemy.mesh.position.copy(enemy.position);

          // Shooting at Player with grace period and accuracy limits
          if (
            hasLineOfSight &&
            distToPlayer < 40 &&
            now - enemy.lastFireTime > enemy.fireCooldown * 1000
          ) {
            enemy.lastFireTime = now;
            soundEngine.playWeaponFire(
              enemy.archetype === 'SNIPER' ? 'sniper' : 'smg',
              false,
              enemy.position
            );

            const hitChance =
              hitChanceBase *
              (enemy.armDamaged ? 0.5 : 1.0) *
              (eng.isSprinting ? 0.6 : 1.0) *
              (eng.isCrouching ? 0.7 : 1.0);

            if (Math.random() < hitChance) {
              const rawDmg =
                (enemy.archetype === 'SNIPER' ? 22 : enemy.archetype === 'HEAVY' ? 10 : 7) *
                dmgMultiplier;

              // Armor absorption
              if (eng.armor > 0) {
                const absorbed = Math.min(eng.armor, rawDmg * 0.7);
                eng.armor -= absorbed;
                eng.hp = Math.max(0, eng.hp - (rawDmg - absorbed));
              } else {
                eng.hp = Math.max(0, eng.hp - rawDmg);
              }

              eng.damageFlash = 0.65;

              // Directional Damage Indicator
              const toAttacker = enemy.position.clone().sub(eng.playerPos);
              const angleToAttacker = Math.atan2(toAttacker.x, toAttacker.z) - eng.yaw;
              eng.damageIndicators.push({
                id: Date.now() + Math.random(),
                angle: angleToAttacker,
                timestamp: now
              });

              if (eng.hp <= 0) {
                soundEngine.setAlarmSiren(false);
                if (document.pointerLockElement) document.exitPointerLock();
                setScreen('GAMEOVER');
                return;
              }
            }
          }
        }
      }

      // Companion Captain Vance
      if (eng.companion) {
        const compTarget = eng.playerPos
          .clone()
          .add(new THREE.Vector3(-2.2, 0, -2.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), eng.yaw));
        compTarget.y = 0;

        const distComp = eng.companion.position.distanceTo(compTarget);
        if (distComp > 2.0) {
          const dir = compTarget.clone().sub(eng.companion.position).normalize();
          eng.companion.position.addScaledVector(dir, 6.2 * dt);
        }
        eng.companion.mesh.position.copy(eng.companion.position);

        // Assist combat
        const nearestEnemy = eng.enemies.find(
          (e) => e.state !== 'DEAD' && e.position.distanceTo(eng.companion!.position) < 32
        );
        if (nearestEnemy) {
          eng.companion.mesh.lookAt(
            nearestEnemy.position.x,
            eng.companion.position.y,
            nearestEnemy.position.z
          );
          if (now - eng.companion.lastFireTime > 1200) {
            eng.companion.lastFireTime = now;
            eng.companion.muzzleLight.intensity = 3.5;
            soundEngine.playWeaponFire('assault_rifle', true, eng.companion.position);
            nearestEnemy.hp -= 15;
            if (nearestEnemy.hp <= 0) {
              nearestEnemy.state = 'DEAD';
              nearestEnemy.mesh.rotation.x = -Math.PI / 2;
              nearestEnemy.mesh.position.y = 0.25;
              eng.kills += 1;
            }
          } else {
            eng.companion.muzzleLight.intensity = THREE.MathUtils.lerp(
              eng.companion.muzzleLight.intensity,
              0,
              dt * 14
            );
          }
        }
      }

      // Clean old damage indicators
      eng.damageIndicators = eng.damageIndicators.filter((i) => now - i.timestamp < 1200);

      // Passive health regen when safe
      if (eng.hp > 0 && eng.hp < eng.maxHp && eng.damageFlash < 0.05) {
        eng.hp = Math.min(eng.maxHp, eng.hp + dt * 2.5);
      }
      eng.damageFlash = THREE.MathUtils.lerp(eng.damageFlash, 0, dt * 3.5);
      eng.flashbangBlindness = THREE.MathUtils.lerp(eng.flashbangBlindness, 0, dt * 0.9);

      // Clean particles
      for (let i = eng.particles.length - 1; i >= 0; i--) {
        const p = eng.particles[i];
        if (now - p.createdAt >= p.duration) {
          scene.remove(p.mesh);
          eng.particles.splice(i, 1);
        }
      }

      // HUD State Sync at 15Hz
      if (now - lastHudSync > 65) {
        lastHudSync = now;
        const wState = eng.weapons[eng.currentWeaponIdx] || {
          id: 'assault_rifle',
          currentMag: 30,
          reserveAmmo: 180
        };
        const aliveEnemies = eng.enemies.filter((e) => e.state !== 'DEAD').length;

        // Current Objective & Waypoint Target
        let objTarget = new THREE.Vector3(0, 1.5, 24);
        let objTitle = 'ДОБРАТЬСЯ ДО КПП ПЕРЕДОВОЙ БАЗЫ';
        let objSub = 'Пройдите инструктаж капитана Вэнса и откройте ворота выхода в город [E]';

        if (eng.objectiveStep === 1 && eng.world) {
          objTarget = eng.world.outpostGate.closedPos;
        } else if (eng.objectiveStep === 2) {
          objTarget = new THREE.Vector3(0, 1.0, -14);
          objTitle = 'НЕЙТРАЛИЗОВАТЬ ДОЗОР ПРОТИВНИКА';
          objSub = 'Ликвидируйте патруль «KRONOS» на проспекте, используя укрытия за машинами';
        } else if (eng.objectiveStep === 3 && eng.world) {
          objTarget = eng.world.dataDrivePos;
          objTitle = 'ЗАХВАТИТЬ ДИСК ДАННЫХ В ОФИСНОМ КОМПЛЕКСЕ';
          objSub = 'Проникните в здание через двери или витрину и скопируйте файлы [E]';
        } else if (eng.objectiveStep === 4 && eng.world) {
          objTarget = eng.world.generatorPos;
          objTitle = 'ПРОРВАТЬ КОНТРАТАКУ ЧЕРЕЗ СКЛАД';
          objSub = 'Подавите сопротивление во дворе и примите тактическое решение у энергоблока';
        } else if (eng.objectiveStep === 5) {
          objTarget = new THREE.Vector3(0, 1.0, -182);
          objTitle = 'ЭВАКУАЦИЯ: ПОДНЯТЬСЯ НА БОРТ RAVEN-1';
          objSub = 'Пробивайтесь к вертолётной площадке и завершите операцию!';
        }

        // Calculate 3D Waypoint Projection
        const wpDist = Math.round(eng.playerPos.distanceTo(objTarget));
        const wpProj = objTarget.clone().project(camera);
        const isBehind = wpProj.z > 1.0;
        const screenX = isBehind ? null : (wpProj.x * 0.5 + 0.5);
        const screenY = isBehind ? null : (-(wpProj.y * 0.5) + 0.5);

        const waypointInfo: WaypointInfo = {
          position: objTarget,
          distance: wpDist,
          screenX,
          screenY,
          isBehind,
          title: objTitle
        };

        // Context Interact Prompt
        let interactPrompt: string | null = null;
        if (
          eng.playerPos.distanceTo(world.outpostGate.closedPos) < 7.0 &&
          !world.outpostGate.isOpen
        ) {
          interactPrompt = 'Открыть ворота КПП [E]';
        } else if (
          !eng.dataDriveSecured &&
          eng.playerPos.distanceTo(world.dataDrivePos) < 5.5
        ) {
          interactPrompt = 'Скачать секретный диск данных «KRONOS» [E]';
        } else {
          for (const d of world.doors) {
            if (eng.playerPos.distanceTo(d.closedPos) < 5.2) {
              interactPrompt = d.label;
            }
          }
        }

        // Tutorial instruction text
        let tutTitle = 'ШАГ 1: ПЕРЕДВИЖЕНИЕ И ОБЗОР';
        let tutInst = 'Используйте клавиши [W, A, S, D] для ходьбы и мышь для поворота камеры.';
        if (eng.tutorialStep === 1) {
          tutTitle = 'ШАГ 2: БЕГ И ПРЫЖКИ';
          tutInst = 'Удерживайте [Shift] для быстрого тактического бега. Нажмите [Пробел] для прыжка.';
        } else if (eng.tutorialStep === 2) {
          tutTitle = 'ШАГ 3: СТРЕЛЬБА И ПРИЦЕЛИВАНИЕ';
          tutInst = 'Нажмите [ПКМ] для точного прицеливания (ADS). [ЛКМ] — стрельба. [R] — перезарядка.';
        } else if (eng.tutorialStep === 3) {
          tutTitle = 'ШАГ 4: ВЗАИМОДЕЙСТВИЕ И ВЫХОД';
          tutInst = 'Подойдите к воротам КПП на севере и нажмите [E] для выхода в город.';
        }

        const headingDeg = (((-eng.yaw * 180) / Math.PI) % 360 + 360) % 360;

        // Current District Name
        let districtName = 'ПЕРЕДОВАЯ БАЗА АЛЬФА';
        if (eng.playerPos.z < 24 && eng.playerPos.z > -42) {
          districtName = 'ЦЕНТРАЛЬНЫЙ ПРОСПЕКТ И ПАРК';
        } else if (eng.playerPos.z <= -42 && eng.playerPos.z > -95) {
          districtName = 'ОФИСНЫЙ КОМПЛЕКС';
        } else if (eng.playerPos.z <= -95 && eng.playerPos.z > -145) {
          districtName = 'ПРОМЫШЛЕННЫЙ СКЛАД';
        } else if (eng.playerPos.z <= -145) {
          districtName = 'ПЛОЩАДКА ЭВАКУАЦИИ RAVEN-1';
        }

        setHudState((prev) => ({
          ...prev,
          hp: eng.hp,
          maxHp: eng.maxHp,
          armor: eng.armor,
          maxArmor: eng.maxArmor,
          difficulty: settingsRef.current.difficulty,
          isAds: eng.isAds,
          isCrouching: eng.isCrouching,
          isSprinting: eng.isSprinting,
          isReloading: eng.isReloading,
          currentWeapon: WEAPONS[wState.id],
          currentMag: wState.currentMag,
          reserveAmmo: wState.reserveAmmo,
          allWeapons: [...eng.weapons],
          grenades: { ...eng.grenades },
          selectedGrenade: eng.selectedGrenade,
          objectiveStep: eng.objectiveStep,
          objectiveTotalSteps: 5,
          objectiveTitle: objTitle,
          objectiveSub: objSub,
          waypoint: waypointInfo,
          currentDistrict: districtName,
          activePathsText: 'ПУТЬ A (УЛИЦА) · B (ПЕРЕУЛОК) · C (ОФИС) · D (КРЫША)',
          weather: 'DAYLIGHT',
          hitMarker:
            prev.hitMarker && now - prev.hitMarker.timestamp < 320 ? prev.hitMarker : null,
          damageFlash: eng.damageFlash,
          damageIndicators: [...eng.damageIndicators],
          flashbangBlindness: eng.flashbangBlindness,
          activeRadio: now < eng.radioExpiresAt ? eng.activeRadio : null,
          companionStatus: 'Капитан Вэнс прикрывает',
          interactPrompt,
          showChoicePrompt: eng.showChoiceModal,
          tacticalChoiceMade: eng.tacticalChoice,
          extractionTimer: eng.extractionTimer,
          enemiesRemaining: aliveEnemies,
          kills: eng.kills,
          headshots: eng.headshots,
          compassHeading: headingDeg,
          tutorial: {
            active: eng.tutorialActive,
            step: eng.tutorialStep,
            title: tutTitle,
            instruction: tutInst,
            completed: eng.tutorialCompleted
          },
          checkpointNotification:
            now < eng.checkpointNoticeExpiresAt ? eng.checkpointNoticeText : null
        }));
      }

      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.dispose();
    };
  }, [
    handleSelectTacticalChoice,
    reachCheckpoint,
    selectedMissionId,
    spawnParticleBurst,
    triggerExplosion,
    triggerInteract,
    triggerRadio,
    triggerReload,
    triggerThrowGrenade
  ]);

  const requestPointerLock = () => {
    soundEngine.init();
    const canvas = engineRef.current.renderer?.domElement;
    if (canvas && canvas.requestPointerLock) {
      canvas.requestPointerLock();
    }
  };

  return (
    <div className="relative w-full h-full bg-[#93c5fd] overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <div ref={canvasContainerRef} className="w-full h-full" />

      {/* Active In-Game HUD & Mobile Touch Controls */}
      {screen === 'PLAYING' && (
        <>
          <TacticalHUD
            hud={hudState}
            isTouchActive={isTouchActive}
            isPointerLocked={isPointerLocked}
            onRequestPointerLock={requestPointerLock}
            onPause={() => {
              if (document.pointerLockElement) document.exitPointerLock();
              setScreen('PAUSED');
            }}
            onToggleTouchMode={() => {
              setSettings((s) => ({
                ...s,
                touchControlsMode: isTouchActive ? 'OFF' : 'ALWAYS_ON'
              }));
            }}
            onSelectTacticalChoice={handleSelectTacticalChoice}
            onSkipTutorial={skipTutorial}
          />

          {isTouchActive && !hudState.showChoicePrompt && (
            <MobileControls
              onMoveInput={(x, y, sprint) => {
                engineRef.current.touchMove = { x, y, sprint };
              }}
              onLookDelta={(dx, dy) => {
                const eng = engineRef.current;
                const sens = settings.sensitivity * (eng.isAds ? 0.55 : 1.0);
                const inv = settings.invertY ? -1 : 1;
                eng.yaw -= dx * sens;
                eng.pitch = THREE.MathUtils.clamp(
                  eng.pitch - dy * sens * inv,
                  -Math.PI / 2.15,
                  Math.PI / 2.15
                );
                eng.weaponRig?.addLookSway(dx * 0.4, dy * 0.4);
              }}
              onFireStateChange={(firing) => {
                soundEngine.init();
                engineRef.current.isFiring = firing;
              }}
              onToggleAds={() => {
                engineRef.current.isAds = !engineRef.current.isAds;
              }}
              onReload={triggerReload}
              onThrowGrenade={triggerThrowGrenade}
              onCycleGrenade={() => {
                const order: GrenadeType[] = ['frag', 'smoke', 'flash'];
                const nextIdx =
                  (order.indexOf(engineRef.current.selectedGrenade) + 1) % order.length;
                engineRef.current.selectedGrenade = order[nextIdx];
              }}
              onSwitchWeapon={() => {
                const eng = engineRef.current;
                if (eng.weapons.length < 2) return;
                eng.currentWeaponIdx = (eng.currentWeaponIdx + 1) % eng.weapons.length;
                eng.isReloading = false;
                eng.isAds = false;
                const wId = eng.weapons[eng.currentWeaponIdx].id;
                eng.weaponRig?.buildWeaponModel(wId, progression.attachments[wId]);
                soundEngine.playMechanicalClick(0, 980, 0.06);
              }}
              onToggleCrouch={() => {
                engineRef.current.isCrouching = !engineRef.current.isCrouching;
              }}
              onJump={() => {
                const eng = engineRef.current;
                if (eng.onGround) {
                  eng.playerVel.y = 6.8;
                  eng.onGround = false;
                  eng.isCrouching = false;
                }
              }}
              onInteract={triggerInteract}
              isAds={hudState.isAds}
              isCrouching={hudState.isCrouching}
              selectedGrenade={hudState.selectedGrenade}
              grenadeCount={hudState.grenades[hudState.selectedGrenade]}
              hasInteractPrompt={Boolean(hudState.interactPrompt)}
            />
          )}
        </>
      )}

      {/* Menus: Main Menu, Loadout, Armory, Settings, Pause, Game Over, Victory */}
      <GameMenus
        screen={screen}
        setScreen={setScreen}
        selectedMissionId={selectedMissionId}
        setSelectedMissionId={setSelectedMissionId}
        progression={progression}
        setProgression={setProgression}
        settings={settings}
        setSettings={setSettings}
        onStartMission={startMission}
        onResumeGame={() => setScreen('PLAYING')}
        onRestartCheckpoint={restartFromCheckpoint}
        lastMissionStats={lastMissionStats}
      />
    </div>
  );
}
