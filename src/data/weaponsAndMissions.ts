import { WeaponConfig, WeaponId, MissionConfig, PlayerProgression, GameSettings } from '../types/game';

export const WEAPONS: Record<WeaponId, WeaponConfig> = {
  assault_rifle: {
    id: 'assault_rifle',
    name: 'M4A1 SOPMOD BLOCK II',
    codeName: 'ASSAULT RIFLE',
    category: 'ASSAULT RIFLE',
    damage: 38,
    fireRateMs: 95,
    magSize: 30,
    maxReserve: 180,
    reloadTimeMs: 1800,
    recoilVertical: 0.016,
    recoilHorizontal: 0.005,
    spreadHip: 0.028,
    spreadAds: 0.003,
    pellets: 1,
    range: 220,
    adsFov: 50,
    unlockXp: 0,
    description: 'Штурмовая винтовка спецподразделений. Высокая точность, контролируемая отдача и универсальность на любой дистанции.'
  },
  smg: {
    id: 'smg',
    name: 'MP7A2 TACTICAL',
    codeName: 'SMG',
    category: 'SMG',
    damage: 28,
    fireRateMs: 65,
    magSize: 40,
    maxReserve: 240,
    reloadTimeMs: 1400,
    recoilVertical: 0.011,
    recoilHorizontal: 0.007,
    spreadHip: 0.020,
    spreadAds: 0.005,
    pellets: 1,
    range: 120,
    adsFov: 56,
    unlockXp: 0,
    description: 'Компактный скорострельный пистолет-пулемёт. Превосходен для штурма зданий и узких переулков.'
  },
  shotgun: {
    id: 'shotgun',
    name: 'M1014 BREACHER',
    codeName: 'SHOTGUN',
    category: 'SHOTGUN',
    damage: 24,
    fireRateMs: 380,
    magSize: 8,
    maxReserve: 56,
    reloadTimeMs: 2100,
    recoilVertical: 0.048,
    recoilHorizontal: 0.015,
    spreadHip: 0.065,
    spreadAds: 0.035,
    pellets: 8,
    range: 60,
    adsFov: 58,
    unlockXp: 200,
    description: 'Тактический полуавтоматический дробовик. Сокрушительная огневая мощь в ближнем бою.'
  },
  sniper: {
    id: 'sniper',
    name: 'MSR .338 LAPUA MAGNUM',
    codeName: 'SNIPER',
    category: 'SNIPER',
    damage: 130,
    fireRateMs: 820,
    magSize: 5,
    maxReserve: 35,
    reloadTimeMs: 2300,
    recoilVertical: 0.065,
    recoilHorizontal: 0.008,
    spreadHip: 0.080,
    spreadAds: 0.0004,
    pellets: 1,
    range: 400,
    adsFov: 20,
    unlockXp: 350,
    description: 'Высокоточная снайперская винтовка с 8x оптикой. Ликвидирует цели с одного выстрела в голову или корпус.'
  },
  pistol: {
    id: 'pistol',
    name: 'USP .45 TACTICAL',
    codeName: 'PISTOL',
    category: 'PISTOL',
    damage: 42,
    fireRateMs: 170,
    magSize: 12,
    maxReserve: 84,
    reloadTimeMs: 1100,
    recoilVertical: 0.018,
    recoilHorizontal: 0.004,
    spreadHip: 0.015,
    spreadAds: 0.002,
    pellets: 1,
    range: 110,
    adsFov: 58,
    unlockXp: 0,
    description: 'Надёжный табельный пистолет калибра .45 ACP. Быстрое извлечение и высокий останавливающий урон.'
  }
};

export const WEAPON_SKINS: Record<string, { name: string; primaryHex: number; secondaryHex: number; accentHex: number; xpCost: number }> = {
  carbon: {
    name: 'TACTICAL BLACK',
    primaryHex: 0x1f242d,
    secondaryHex: 0x333b47,
    accentHex: 0xf59e0b,
    xpCost: 0
  },
  desert: {
    name: 'DESERT COYOTE',
    primaryHex: 0x92785d,
    secondaryHex: 0x47392c,
    accentHex: 0xd97706,
    xpCost: 150
  },
  arctic: {
    name: 'URBAN CAMO',
    primaryHex: 0xd1d5db,
    secondaryHex: 0x374151,
    accentHex: 0x38bdf8,
    xpCost: 250
  },
  crimson: {
    name: 'SPEC-OPS ELITE',
    primaryHex: 0x181a20,
    secondaryHex: 0x991b1b,
    accentHex: 0xef4444,
    xpCost: 400
  }
};

export const MISSIONS: MissionConfig[] = [
  {
    id: 1,
    title: 'OPERATION 01: FIRST CONTACT',
    code: 'OP-01 // СЕКТОР «СОЛНЕЧНЫЙ ЦЕНТР — БАЗА ОМЕГА»',
    districtName: 'Передовая база → Центральный проспект → Офис → Эвакуация',
    briefing:
      'ЧВК «KRONOS» захватила центральный городской узел связи. Начните на передовой базе, пройдите инструктаж капитана Вэнса, проникните в офисный комплекс через улицу, переулок или крышу, захватите диск данных и эвакуируйтесь на борту вертолёта RAVEN-1.',
    weatherStart: 'DAYLIGHT',
    enemyCountMultiplier: 1.0,
    xpReward: 600
  },
  {
    id: 2,
    title: 'OPERATION 02: CITADEL ASSAULT',
    code: 'OP-02 // СЕКТОР «ПРОМЫШЛЕННЫЙ ПЕРИМЕТР»',
    districtName: 'Парковка → Складские комплексы → Крыши',
    briefing:
      'Контратака вражеских штурмовиков и снайперов в промышленной зоне. Используйте укрытия, уничтожайте огневые точки и подавите сопротивление.',
    weatherStart: 'GOLDEN_HOUR',
    enemyCountMultiplier: 1.25,
    xpReward: 850
  },
  {
    id: 3,
    title: 'OPERATION 03: APEX PROTOCOL',
    code: 'OP-03 // ЦИТАДЕЛЬ «KRONOS»',
    districtName: 'Крыши небоскрёбов → Командный бункер',
    briefing:
      'Финальный штурм цитадели. Опытные отряды спецназа, джаггернауты и эвакуация под шквальным огнём.',
    weatherStart: 'OVERCAST',
    enemyCountMultiplier: 1.5,
    xpReward: 1200
  }
];

export const DEFAULT_PROGRESSION: PlayerProgression = {
  xp: 350,
  level: 1,
  unlockedWeapons: ['assault_rifle', 'smg', 'pistol'],
  primaryWeapon: 'assault_rifle',
  secondaryWeapon: 'pistol',
  attachments: {
    assault_rifle: { optic: 'holo', magazine: 'standard', muzzle: 'standard', skin: 'carbon' },
    smg: { optic: 'iron', magazine: 'standard', muzzle: 'standard', skin: 'carbon' },
    shotgun: { optic: 'iron', magazine: 'standard', muzzle: 'standard', skin: 'carbon' },
    sniper: { optic: 'acog', magazine: 'standard', muzzle: 'standard', skin: 'carbon' },
    pistol: { optic: 'iron', magazine: 'standard', muzzle: 'standard', skin: 'carbon' }
  },
  bonusGrenades: false,
  missionsCompleted: [],
  currentCheckpointId: 0
};

export const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'EASY', // Default difficulty is EASY as requested!
  sensitivity: 1.0,
  invertY: false,
  volume: 0.8,
  musicVolume: 0.5,
  fov: 75,
  graphicsQuality: 'HIGH',
  touchControlsMode: 'AUTO',
  weatherOverride: 'DYNAMIC'
};
