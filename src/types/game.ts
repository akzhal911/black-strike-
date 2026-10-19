import * as THREE from 'three';

export type WeaponId = 'assault_rifle' | 'smg' | 'shotgun' | 'sniper' | 'pistol';
export type GrenadeType = 'frag' | 'smoke' | 'flash';
export type EnemyArchetype = 'AGGRESSIVE' | 'DEFENSIVE' | 'TACTICAL' | 'SNIPER' | 'HEAVY';
export type HitZone = 'HEAD' | 'BODY' | 'ARMS' | 'LEGS';
export type WeatherState = 'DAYLIGHT' | 'OVERCAST' | 'GOLDEN_HOUR' | 'RAIN';
export type MusicMood = 'MENU' | 'AMBIENT' | 'COMBAT' | 'CHASE' | 'FINALE' | 'VICTORY';
export type MenuScreen = 'MAIN' | 'MISSIONS' | 'LOADOUT' | 'ARMORY' | 'SETTINGS' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'TWIST' | 'GAMEOVER';
export type TacticalChoiceOption = 'NONE' | 'DESTROY_GENERATOR' | 'DISABLE_ALARM';
export type DifficultyLevel = 'STORY' | 'EASY' | 'NORMAL' | 'HARD';

export interface WeaponAttachmentState {
  optic: 'iron' | 'holo' | 'acog';
  magazine: 'standard' | 'extended';
  muzzle: 'standard' | 'compensator' | 'suppressor';
  skin: 'carbon' | 'desert' | 'arctic' | 'crimson';
}

export interface WeaponConfig {
  id: WeaponId;
  name: string;
  codeName: string;
  category: 'ASSAULT RIFLE' | 'SMG' | 'SHOTGUN' | 'SNIPER' | 'PISTOL';
  damage: number;
  fireRateMs: number;
  magSize: number;
  maxReserve: number;
  reloadTimeMs: number;
  recoilVertical: number;
  recoilHorizontal: number;
  spreadHip: number;
  spreadAds: number;
  pellets: number;
  range: number;
  adsFov: number;
  unlockXp: number;
  description: string;
}

export interface WeaponRuntimeState {
  id: WeaponId;
  currentMag: number;
  reserveAmmo: number;
}

export interface RadioMessage {
  id: string;
  sender: string;
  role: string;
  text: string;
  priority?: 'normal' | 'warning' | 'critical';
  durationMs?: number;
}

export interface EnemyEntity {
  id: string;
  archetype: EnemyArchetype;
  name: string;
  mesh: THREE.Group;
  headMesh: THREE.Mesh;
  bodyMesh: THREE.Mesh;
  leftArmMesh: THREE.Mesh;
  rightArmMesh: THREE.Mesh;
  leftLegMesh: THREE.Mesh;
  rightLegMesh: THREE.Mesh;
  laserLine?: THREE.Line;
  alertMarkerMesh?: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  patrolPoints: THREE.Vector3[];
  currentPatrolIdx: number;
  hp: number;
  maxHp: number;
  armor: number;
  speed: number;
  baseSpeed: number;
  legDamaged: boolean;
  armDamaged: boolean;
  state: 'PATROL' | 'ALERT' | 'COMBAT' | 'COVER' | 'FLANK' | 'RETREAT' | 'STUNNED' | 'DEAD';
  stateTimer: number;
  alertDelayTimer: number; // reaction delay before shooting
  lastFireTime: number;
  fireCooldown: number;
  stunTimer: number;
  coverTarget: THREE.Vector3 | null;
  alertedSquad: boolean;
  district: number;
}

export interface CompanionEntity {
  mesh: THREE.Group;
  position: THREE.Vector3;
  targetPosition: THREE.Vector3;
  state: 'FOLLOW' | 'COMBAT' | 'COVER' | 'HOLD';
  lastFireTime: number;
  lastCalloutTime: number;
  muzzleLight: THREE.PointLight;
}

export interface BreakableWindow {
  id: string;
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  broken: boolean;
  box: THREE.Box3;
}

export interface ExplosiveObject {
  id: string;
  type: 'car' | 'barrel' | 'generator';
  mesh: THREE.Group | THREE.Mesh;
  position: THREE.Vector3;
  hp: number;
  exploded: boolean;
  radius: number;
  box: THREE.Box3;
}

export interface DestructibleCrate {
  id: string;
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  hp: number;
  destroyed: boolean;
  box: THREE.Box3;
  dropsAmmo: boolean;
}

export interface InteractiveDoor {
  id: string;
  mesh: THREE.Mesh;
  closedPos: THREE.Vector3;
  openPos: THREE.Vector3;
  isOpen: boolean;
  box: THREE.Box3;
  label: string;
}

export interface AmmoPickup {
  id: string;
  mesh: THREE.Group;
  position: THREE.Vector3;
  collected: boolean;
  amountFactor: number;
}

export interface MedkitPickup {
  id: string;
  mesh: THREE.Group;
  position: THREE.Vector3;
  collected: boolean;
  healAmount: number;
}

export interface ArmorPickup {
  id: string;
  mesh: THREE.Group;
  position: THREE.Vector3;
  collected: boolean;
  armorAmount: number;
}

export interface ActiveGrenade {
  id: string;
  type: GrenadeType;
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  timer: number;
  isEnemy: boolean;
}

export interface SmokeCloud {
  position: THREE.Vector3;
  radius: number;
  expiresAt: number;
  particles: THREE.Points;
}

export interface ParticleBurst {
  mesh: THREE.Points | THREE.Mesh;
  velocities?: Float32Array;
  createdAt: number;
  duration: number;
  type: 'sparks' | 'smoke' | 'blood' | 'glass' | 'fire' | 'shell';
  velocityVec?: THREE.Vector3;
  rotVel?: THREE.Vector3;
}

export interface CheckpointData {
  id: number;
  position: THREE.Vector3;
  yaw: number;
  title: string;
  objectiveIdx: number;
}

export interface DamageIndicator {
  id: number;
  angle: number; // Angle relative to player look direction (-PI to PI)
  timestamp: number;
}

export interface TutorialState {
  active: boolean;
  step: number; // 0: Movement, 1: Sprint & Jump, 2: Aim & Shoot, 3: Reach Gate
  title: string;
  instruction: string;
  completed: boolean;
}

export interface GameSettings {
  difficulty: DifficultyLevel;
  sensitivity: number;
  invertY: boolean;
  volume: number;
  musicVolume: number;
  fov: number;
  graphicsQuality: 'HIGH' | 'MEDIUM';
  touchControlsMode: 'AUTO' | 'ALWAYS_ON' | 'OFF';
  weatherOverride: 'DYNAMIC' | 'DAYLIGHT' | 'OVERCAST' | 'GOLDEN_HOUR';
}

export interface PlayerProgression {
  xp: number;
  level: number;
  unlockedWeapons: WeaponId[];
  primaryWeapon: WeaponId;
  secondaryWeapon: WeaponId;
  attachments: Record<WeaponId, WeaponAttachmentState>;
  bonusGrenades: boolean;
  missionsCompleted: number[];
  currentCheckpointId: number;
}

export interface MissionConfig {
  id: number;
  title: string;
  code: string;
  districtName: string;
  briefing: string;
  weatherStart: WeatherState;
  enemyCountMultiplier: number;
  xpReward: number;
}

export interface WaypointInfo {
  position: THREE.Vector3;
  distance: number;
  screenX: number | null; // 0..1 or null if behind
  screenY: number | null;
  isBehind: boolean;
  title: string;
}

export interface HUDState {
  hp: number;
  maxHp: number;
  armor: number;
  maxArmor: number;
  stamina: number;
  difficulty: DifficultyLevel;
  isAds: boolean;
  isCrouching: boolean;
  isSprinting: boolean;
  isReloading: boolean;
  currentWeapon: WeaponConfig;
  currentMag: number;
  reserveAmmo: number;
  allWeapons: WeaponRuntimeState[];
  grenades: Record<GrenadeType, number>;
  selectedGrenade: GrenadeType;
  objectiveStep: number;
  objectiveTotalSteps: number;
  objectiveTitle: string;
  objectiveSub: string;
  objectiveStatusBanner: { text: string; subText?: string; timestamp: number } | null;
  waypoint: WaypointInfo | null;
  currentDistrict: string;
  activePathsText: string;
  weather: WeatherState;
  hitMarker: { active: boolean; zone: HitZone; killed: boolean; timestamp: number } | null;
  damageFlash: number;
  damageIndicators: DamageIndicator[];
  flashbangBlindness: number;
  activeRadio: RadioMessage | null;
  companionStatus: string;
  interactPrompt: string | null;
  showChoicePrompt: boolean;
  tacticalChoiceMade: TacticalChoiceOption;
  extractionTimer: number | null;
  enemiesRemaining: number;
  kills: number;
  headshots: number;
  compassHeading: number;
  tutorial: TutorialState;
  checkpointNotification: string | null;
}
