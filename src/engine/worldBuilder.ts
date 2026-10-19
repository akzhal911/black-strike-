import * as THREE from 'three';
import {
  AmmoPickup,
  ArmorPickup,
  BreakableWindow,
  CheckpointData,
  CompanionEntity,
  DestructibleCrate,
  EnemyArchetype,
  EnemyEntity,
  ExplosiveObject,
  InteractiveDoor,
  MedkitPickup
} from '../types/game';

export interface BuiltWorldData {
  worldGroup: THREE.Group;
  colliders: THREE.Box3[];
  walkableRoofs: { box: THREE.Box3; topY: number }[];
  windows: BreakableWindow[];
  explosives: ExplosiveObject[];
  crates: DestructibleCrate[];
  doors: InteractiveDoor[];
  ammoPickups: AmmoPickup[];
  medkitPickups: MedkitPickup[];
  armorPickups: ArmorPickup[];
  checkpoints: CheckpointData[];
  streetLights: THREE.PointLight[];
  indoorLights: THREE.PointLight[];
  emergencyLights: THREE.PointLight[];
  asphaltMaterial: THREE.MeshStandardMaterial;
  extractionHelicopter: THREE.Group;
  helicopterRotors: THREE.Object3D[];
  dataDriveMesh: THREE.Group;
  generatorPos: THREE.Vector3;
  alarmTerminalPos: THREE.Vector3;
  dataDrivePos: THREE.Vector3;
  outpostGate: InteractiveDoor;
  menuOperatorGroup: THREE.Group;
  sunLight: THREE.DirectionalLight;
}

function createCleanAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Bright, clean modern road surface
  ctx.fillStyle = '#3a424e';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle concrete aggregate grain
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const v = 60 + Math.floor(Math.random() * 25);
    ctx.fillStyle = `rgb(${v},${v + 2},${v + 4})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Crisp white lane markings & crosswalk lines
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(250, 0, 12, 512);

  // Yellow warning edge strips
  ctx.fillStyle = '#eab308';
  ctx.fillRect(8, 0, 8, 512);
  ctx.fillRect(496, 0, 8, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 28);
  return tex;
}

function createModernFacadeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Clean light sandstone / off-white concrete
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  for (let y = 0; y < 256; y += 32) {
    ctx.strokeRect(0, y, 256, 32);
  }

  // Windows with blue sky reflection
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(col * 40 + 10, row * 40 + 8, 22, 22);

      // Glass shine highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(col * 40 + 12, row * 40 + 10, 8, 8);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function createCrateTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#855835';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#4a2f16';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 120, 120);
  ctx.beginPath();
  ctx.moveTo(4, 4);
  ctx.lineTo(124, 124);
  ctx.moveTo(124, 4);
  ctx.lineTo(4, 124);
  ctx.stroke();
  return new THREE.CanvasTexture(canvas);
}

export function buildGameWorld(scene: THREE.Scene): BuiltWorldData {
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  const colliders: THREE.Box3[] = [];
  const walkableRoofs: { box: THREE.Box3; topY: number }[] = [];
  const windows: BreakableWindow[] = [];
  const explosives: ExplosiveObject[] = [];
  const crates: DestructibleCrate[] = [];
  const doors: InteractiveDoor[] = [];
  const ammoPickups: AmmoPickup[] = [];
  const medkitPickups: MedkitPickup[] = [];
  const armorPickups: ArmorPickup[] = [];
  const streetLights: THREE.PointLight[] = [];
  const indoorLights: THREE.PointLight[] = [];
  const emergencyLights: THREE.PointLight[] = [];

  const asphaltTex = createCleanAsphaltTexture();
  const facadeTex = createModernFacadeTexture();
  const crateTex = createCrateTexture();

  const asphaltMaterial = new THREE.MeshStandardMaterial({
    map: asphaltTex,
    roughness: 0.5,
    metalness: 0.1
  });

  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0xcfd8dc,
    roughness: 0.6,
    metalness: 0.1
  });

  const modernBuildingMat = new THREE.MeshStandardMaterial({
    map: facadeTex,
    roughness: 0.45,
    metalness: 0.15
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.35,
    metalness: 0.8
  });

  const sandbagMat = new THREE.MeshStandardMaterial({
    color: 0xa89f81,
    roughness: 0.85,
    metalness: 0.05
  });

  const crateMat = new THREE.MeshStandardMaterial({
    map: crateTex,
    roughness: 0.75,
    metalness: 0.05
  });

  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x228b22,
    roughness: 0.8,
    metalness: 0.05
  });

  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x5c4033,
    roughness: 0.9,
    metalness: 0.05
  });

  // Helper to add static box wall with shadow
  const addWall = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: THREE.Material = modernBuildingMat,
    isWalkable = false
  ) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    worldGroup.add(mesh);
    const box = new THREE.Box3().setFromObject(mesh);
    colliders.push(box);
    if (isWalkable) {
      walkableRoofs.push({ box, topY: y + h / 2 });
    }
    return mesh;
  };

  // Helper for trees
  const addTree = (x: number, z: number) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 3.2, 8), trunkMat);
    trunk.position.set(x, 1.6, z);
    trunk.castShadow = true;
    worldGroup.add(trunk);
    colliders.push(new THREE.Box3().setFromObject(trunk));

    const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.8, 3.8, 8), foliageMat);
    leaves.position.set(x, 4.2, z);
    leaves.castShadow = true;
    worldGroup.add(leaves);
  };

  // Helper for breakable glass windows
  const addGlassWindow = (x: number, y: number, z: number, w: number, h: number, d: number) => {
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.1
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glassMat);
    mesh.position.set(x, y, z);
    worldGroup.add(mesh);
    const box = new THREE.Box3().setFromObject(mesh);
    windows.push({
      id: `win_${windows.length}`,
      mesh,
      position: new THREE.Vector3(x, y, z),
      broken: false,
      box
    });
  };

  // Helper for destructible crates
  const addCrate = (x: number, y: number, z: number, size = 1.3, dropsAmmo = false) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), crateMat.clone());
    mesh.position.set(x, y + size / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    worldGroup.add(mesh);
    const box = new THREE.Box3().setFromObject(mesh);
    crates.push({
      id: `crate_${crates.length}`,
      mesh,
      position: mesh.position.clone(),
      hp: 45,
      destroyed: false,
      box,
      dropsAmmo
    });
  };

  // Helper for explosive barrels
  const addExplosiveBarrel = (x: number, y: number, z: number) => {
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.35,
      metalness: 0.6
    });
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.35, 14), barrelMat);
    mesh.position.set(x, y + 0.675, z);
    mesh.castShadow = true;
    worldGroup.add(mesh);
    const box = new THREE.Box3().setFromObject(mesh);
    explosives.push({
      id: `barrel_${explosives.length}`,
      type: 'barrel',
      mesh,
      position: mesh.position.clone(),
      hp: 35,
      exploded: false,
      radius: 9.5,
      box
    });
  };

  // Helper for civilian / tactical cars
  const addCar = (x: number, z: number, rotY: number, colorHex: number) => {
    const carGroup = new THREE.Group();
    carGroup.position.set(x, 0, z);
    carGroup.rotation.y = rotY;

    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.3,
      metalness: 0.7
    });
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.85, 4.4), bodyMat);
    chassis.position.y = 0.65;
    chassis.castShadow = true;
    carGroup.add(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.7, 2.2), darkMetalMat);
    cabin.position.set(0, 1.38, -0.2);
    carGroup.add(cabin);

    // Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    for (const wx of [-1.05, 1.05]) {
      for (const wz of [-1.3, 1.3]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.28, 12), wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.38, wz);
        carGroup.add(wheel);
      }
    }

    worldGroup.add(carGroup);
    const box = new THREE.Box3().setFromObject(carGroup);
    colliders.push(box);
    explosives.push({
      id: `car_${explosives.length}`,
      type: 'car',
      mesh: carGroup,
      position: new THREE.Vector3(x, 1.0, z),
      hp: 120,
      exploded: false,
      radius: 12,
      box
    });
    return carGroup;
  };

  // Helper for Medkit (+50 HP)
  const addMedkit = (x: number, y: number, z: number) => {
    const group = new THREE.Group();
    group.position.set(x, y + 0.35, z);

    const kitBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.35, 0.45),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    group.add(kitBox);

    const crossH = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.08, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x22c55e })
    );
    crossH.position.set(0, 0.02, 0.23);
    const crossV = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.32, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x22c55e })
    );
    crossV.position.set(0, 0.02, 0.23);
    group.add(crossH, crossV);

    const halo = new THREE.PointLight(0x22c55e, 1.2, 5);
    halo.position.set(0, 0.3, 0);
    group.add(halo);

    worldGroup.add(group);
    medkitPickups.push({
      id: `medkit_${medkitPickups.length}`,
      mesh: group,
      position: group.position.clone(),
      collected: false,
      healAmount: 50
    });
  };

  // Helper for Armor Plate (+50 Armor)
  const addArmorPlate = (x: number, y: number, z: number) => {
    const group = new THREE.Group();
    group.position.set(x, y + 0.35, z);

    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.45, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8, roughness: 0.2 })
    );
    group.add(plate);

    const halo = new THREE.PointLight(0x38bdf8, 1.2, 5);
    halo.position.set(0, 0.3, 0);
    group.add(halo);

    worldGroup.add(group);
    armorPickups.push({
      id: `armor_${armorPickups.length}`,
      mesh: group,
      position: group.position.clone(),
      collected: false,
      armorAmount: 50
    });
  };

  // Helper for Ammo Supply Box
  const addAmmoCache = (x: number, y: number, z: number) => {
    const group = new THREE.Group();
    group.position.set(x, y + 0.3, z);

    const boxMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.45, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4, metalness: 0.6 })
    );
    group.add(boxMesh);

    const beacon = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.08, 0.25),
      new THREE.MeshBasicMaterial({ color: 0x22c55e })
    );
    beacon.position.y = 0.26;
    group.add(beacon);

    worldGroup.add(group);
    ammoPickups.push({
      id: `ammo_${ammoPickups.length}`,
      mesh: group,
      position: group.position.clone(),
      collected: false,
      amountFactor: 0.65
    });
  };

  // 1. Broad ground plane (clean, bright daylight city)
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(180, 360), asphaltMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -75);
  ground.receiveShadow = true;
  worldGroup.add(ground);

  // Sidewalks on left and right
  const leftSidewalk = new THREE.Mesh(new THREE.BoxGeometry(10, 0.25, 340), sidewalkMat);
  leftSidewalk.position.set(-16, 0.125, -75);
  leftSidewalk.receiveShadow = true;
  worldGroup.add(leftSidewalk);

  const rightSidewalk = new THREE.Mesh(new THREE.BoxGeometry(10, 0.25, 340), sidewalkMat);
  rightSidewalk.position.set(16, 0.125, -75);
  rightSidewalk.receiveShadow = true;
  worldGroup.add(rightSidewalk);

  // Outer boundary walls
  addWall(-32, 8, -75, 2, 16, 320, modernBuildingMat);
  addWall(32, 8, -75, 2, 16, 320, modernBuildingMat);
  addWall(0, 8, 65, 66, 16, 2, modernBuildingMat);
  addWall(0, 8, -215, 66, 16, 2, modernBuildingMat);

  // Distant sunny skyscraper silhouettes
  for (let i = 0; i < 20; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const bx = side * (44 + (i % 3) * 12);
    const bz = 45 - i * 14;
    const bh = 32 + (i % 4) * 16;
    const skyMesh = new THREE.Mesh(new THREE.BoxGeometry(18, bh, 18), modernBuildingMat);
    skyMesh.position.set(bx, bh / 2, bz);
    worldGroup.add(skyMesh);
  }

  // ============================================================================
  // ZONE 0: FORWARD OPERATING BASE ALPHA / STAGING POST (Z: +58 to +24)
  // Well-lit, safe, sunny military staging area with commander and tutorial items!
  // ============================================================================
  // Sandbag barricades protecting spawn
  addWall(-4, 0.6, 56, 4.5, 1.2, 0.8, sandbagMat);
  addWall(4, 0.6, 56, 4.5, 1.2, 0.8, sandbagMat);
  addWall(-8, 0.6, 44, 4.5, 1.2, 0.8, sandbagMat);
  addWall(8, 0.6, 44, 4.5, 1.2, 0.8, sandbagMat);

  // Military command tent & crates
  const tent = new THREE.Mesh(new THREE.ConeGeometry(5, 4.2, 4), sandbagMat);
  tent.position.set(-12, 2.1, 48);
  tent.rotation.y = Math.PI / 4;
  worldGroup.add(tent);
  colliders.push(new THREE.Box3().setFromObject(tent));

  // Training targets in the staging area for shooting practice
  for (const tx of [-3, 0, 3]) {
    const targetStand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8), darkMetalMat);
    targetStand.position.set(tx, 0.9, 36);
    worldGroup.add(targetStand);
    const targetBoard = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0xef4444 })
    );
    targetBoard.rotation.x = Math.PI / 2;
    targetBoard.position.set(tx, 1.5, 36);
    worldGroup.add(targetBoard);
  }

  // Starting supplies in FOB Alpha
  addAmmoCache(-4, 0, 50);
  addAmmoCache(4, 0, 50);
  addMedkit(3, 0, 48);
  addArmorPlate(-3, 0, 48);

  // Checkpoint 1 Gate Barrier at Z = +24
  addWall(-14, 2.5, 24, 14, 5, 1.2, modernBuildingMat);
  addWall(14, 2.5, 24, 14, 5, 1.2, modernBuildingMat);

  // Interactive Outpost Gate (opens with [E] or automatically as player approaches)
  const gateMesh = new THREE.Mesh(new THREE.BoxGeometry(14, 4.2, 0.4), darkMetalMat);
  gateMesh.position.set(0, 2.1, 24);
  worldGroup.add(gateMesh);
  const outpostGate: InteractiveDoor = {
    id: 'fob_checkpoint_gate',
    mesh: gateMesh,
    closedPos: new THREE.Vector3(0, 2.1, 24),
    openPos: new THREE.Vector3(0, 7.0, 24),
    isOpen: false,
    box: new THREE.Box3().setFromObject(gateMesh),
    label: 'Открыть ворота КПП [E]'
  };
  doors.push(outpostGate);

  // ============================================================================
  // ZONE 1: SUNNY BOULEVARD & PARK (Z: +24 to -40)
  // Wide avenue, trees, parked cars, cover, gentle scout patrol
  // ============================================================================
  addTree(-8, 14);
  addTree(8, 14);
  addTree(-8, -4);
  addTree(8, -4);

  // Parked civilian cars for realistic cover
  addCar(-5, 6, 0.15, 0x0284c7); // Blue sedan
  addCar(6, -8, -0.2, 0xd97706); // Amber SUV
  addCar(-4, -22, 0.1, 0x475569); // Slate wagon

  addExplosiveBarrel(2, 0, -14);
  addCrate(4, 0, -6, 1.3, true);
  addCrate(-3, 0, -18, 1.3, false);
  addMedkit(-6, 0, -12);
  addArmorPlate(7, 0, -26);
  addAmmoCache(0, 0, -28);

  // ============================================================================
  // ZONE 2: CORPORATE OFFICE COMPLEX & PLAZA (Z: -40 to -95)
  // Large glass entrance, reception lobby, 2nd floor catwalk, server room with DATA DRIVE!
  // ============================================================================
  // Office building exterior walls
  addWall(19, 4.8, -68, 22, 0.6, 52, modernBuildingMat, true); // Roof / 2nd floor ceiling
  addWall(19, 2.2, -42, 22, 4.4, 0.6, modernBuildingMat); // Front wall
  addWall(19, 2.2, -94, 22, 4.4, 0.6, modernBuildingMat); // Back wall

  // Large breakable glass windows on front facade
  addGlassWindow(12, 2.2, -42, 6, 3.8, 0.2);
  addGlassWindow(22, 2.2, -42, 6, 3.8, 0.2);

  // Interactive office glass sliding door
  const officeDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.8, 0.3), darkMetalMat);
  officeDoorMesh.position.set(16, 1.9, -42);
  worldGroup.add(officeDoorMesh);
  doors.push({
    id: 'door_office_front',
    mesh: officeDoorMesh,
    closedPos: new THREE.Vector3(16, 1.9, -42),
    openPos: new THREE.Vector3(16, 1.9, -38),
    isOpen: false,
    box: new THREE.Box3().setFromObject(officeDoorMesh),
    label: 'Открыть вход в офис [E]'
  });

  // Office Interior Desks & Partitions
  addWall(15, 1.1, -55, 6, 2.2, 0.4, modernBuildingMat);
  addWall(23, 1.1, -55, 6, 2.2, 0.4, modernBuildingMat);
  addWall(19, 1.1, -72, 8, 2.2, 0.4, modernBuildingMat);

  // CLASSIFIED DATA DRIVE SERVER CONSOLE at (19, 0, -82)
  const dataDrivePos = new THREE.Vector3(19, 1.2, -82);
  const dataDriveMesh = new THREE.Group();
  dataDriveMesh.position.copy(dataDrivePos);

  const serverRack = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 2.4, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 })
  );
  dataDriveMesh.add(serverRack);

  // Glowing holographic data drive
  const driveCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.12, 0.6),
    new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
  );
  driveCore.position.set(0, 0.4, 0.62);
  dataDriveMesh.add(driveCore);

  const driveLight = new THREE.PointLight(0x06b6d4, 2.5, 10);
  driveLight.position.set(0, 0.6, 0.8);
  dataDriveMesh.add(driveLight);

  worldGroup.add(dataDriveMesh);
  colliders.push(new THREE.Box3().setFromObject(serverRack));

  addMedkit(14, 0, -78);
  addArmorPlate(24, 0, -78);
  addAmmoCache(19, 0, -60);

  // Rooftop Sniper Overlook & Walkable Catwalk on Left Flank (Route D)
  // Height 5.2m, length 48m, Z: -15 to -65
  addWall(-16, 2.6, -40, 8, 5.2, 50, modernBuildingMat, true);
  addWall(-12.2, 5.8, -30, 0.5, 1.2, 16, modernBuildingMat);
  addWall(-12.2, 5.8, -50, 0.5, 1.2, 16, modernBuildingMat);

  // Staircase to rooftop catwalk at (-16, 0..5.2, -10..-18)
  for (let s = 0; s < 10; s++) {
    const stepH = ((s + 1) / 10) * 5.2;
    const stepZ = -9 - s * 1.05;
    addWall(-16, stepH / 2, stepZ, 3.4, stepH, 1.15, darkMetalMat, true);
  }

  // ============================================================================
  // ZONE 3: INDUSTRIAL COURTYARD & SUBSTATION (Z: -95 to -145)
  // ============================================================================
  addWall(-12, 1.8, -112, 4.2, 3.6, 9.5, new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 }), true);
  addWall(12, 1.8, -112, 4.2, 3.6, 9.5, new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4 }), true);
  addExplosiveBarrel(-6, 0, -118);
  addExplosiveBarrel(6, 0, -118);
  addCrate(-3, 0, -108, 1.4, true);
  addCrate(3, 0, -125, 1.4, true);
  addMedkit(-10, 0, -122);
  addArmorPlate(10, 0, -122);

  // Generator & Alarm Terminal for Tactical Choice at Z = -132
  const generatorPos = new THREE.Vector3(-8, 1.4, -132);
  const genGroup = new THREE.Group();
  genGroup.position.copy(generatorPos);
  const genMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3.0, 2.4, 2.2),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.8 })
  );
  genGroup.add(genMesh);
  worldGroup.add(genGroup);
  explosives.push({
    id: 'main_generator',
    type: 'generator',
    mesh: genGroup,
    position: generatorPos.clone(),
    hp: 80,
    exploded: false,
    radius: 11,
    box: new THREE.Box3().setFromObject(genGroup)
  });

  const alarmTerminalPos = new THREE.Vector3(8, 1.4, -132);
  const termGroup = new THREE.Group();
  termGroup.position.copy(alarmTerminalPos);
  const termMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 1.1), darkMetalMat);
  termGroup.add(termMesh);
  worldGroup.add(termGroup);
  colliders.push(new THREE.Box3().setFromObject(termGroup));

  // ============================================================================
  // ZONE 4: CITADEL EXTRACTION LZ & HELIPAD (Z: -145 to -205)
  // Large open plaza with helipad ring, RAVEN-1 helicopter!
  // ============================================================================
  addWall(-10, 0.9, -158, 5, 1.8, 1.0, sandbagMat);
  addWall(10, 0.9, -158, 5, 1.8, 1.0, sandbagMat);
  addMedkit(-6, 0, -160);
  addArmorPlate(6, 0, -160);
  addAmmoCache(0, 0, -162);

  // Helipad ring & yellow H
  const helipadRing = new THREE.Mesh(
    new THREE.RingGeometry(6.8, 7.5, 36),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide })
  );
  helipadRing.rotation.x = -Math.PI / 2;
  helipadRing.position.set(0, 0.04, -182);
  worldGroup.add(helipadRing);

  // Extraction Transport Helicopter ("RAVEN-1")
  const extractionHelicopter = new THREE.Group();
  extractionHelicopter.position.set(0, 22, -220); // Flies in smoothly to landing pad
  extractionHelicopter.visible = false;

  const fuselage = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.8, 9.2), darkMetalMat);
  fuselage.position.y = 2.0;
  fuselage.castShadow = true;
  extractionHelicopter.add(fuselage);

  const cockpit = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 1.8, 2.4),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.8 })
  );
  cockpit.position.set(0, 2.2, 3.4);
  extractionHelicopter.add(cockpit);

  const tailBoom = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 6.8), darkMetalMat);
  tailBoom.position.set(0, 2.5, -7.0);
  extractionHelicopter.add(tailBoom);

  const mainRotor = new THREE.Mesh(
    new THREE.BoxGeometry(12.5, 0.08, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x1e293b })
  );
  mainRotor.position.set(0, 3.75, 0);
  extractionHelicopter.add(mainRotor);

  const mainRotorCross = mainRotor.clone();
  mainRotorCross.rotation.y = Math.PI / 2;
  mainRotor.add(mainRotorCross);

  worldGroup.add(extractionHelicopter);

  // ============================================================================
  // 5 MAIN CHECKPOINTS
  // ============================================================================
  const checkpoints: CheckpointData[] = [
    {
      id: 0,
      position: new THREE.Vector3(0, 1.7, 52),
      yaw: 0,
      title: 'ПЕРЕДОВАЯ БАЗА АЛЬФА',
      objectiveIdx: 0
    },
    {
      id: 1,
      position: new THREE.Vector3(0, 1.7, 20),
      yaw: 0,
      title: 'КПП ВЫХОДА В ГОРОД',
      objectiveIdx: 1
    },
    {
      id: 2,
      position: new THREE.Vector3(0, 1.7, -35),
      yaw: 0,
      title: 'ПРОСПЕКТ И ВХОД В ОФИС',
      objectiveIdx: 2
    },
    {
      id: 3,
      position: new THREE.Vector3(19, 1.7, -76),
      yaw: 0,
      title: 'СЕРВЕРНАЯ · ДАННЫЕ ЗАХВАЧЕНЫ',
      objectiveIdx: 3
    },
    {
      id: 4,
      position: new THREE.Vector3(0, 1.7, -152),
      yaw: 0,
      title: 'ПЛОЩАДКА ЭВАКУАЦИИ RAVEN-1',
      objectiveIdx: 4
    }
  ];

  // ============================================================================
  // 3D MAIN MENU DIORAMA AT (85, 0, 85) - Bright Daylight Tactical Staging
  // ============================================================================
  const menuStage = new THREE.Group();
  menuStage.position.set(85, 0, 85);
  worldGroup.add(menuStage);

  const menuFloor = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), asphaltMaterial);
  menuFloor.rotation.x = -Math.PI / 2;
  menuStage.add(menuFloor);

  // Tactical Operator standing ready in daylight
  const menuOperatorGroup = new THREE.Group();
  menuOperatorGroup.position.set(0.65, 0, 1.5);
  menuOperatorGroup.rotation.y = -0.3;

  const armorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.6 });
  const opTorso = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.78, 0.34), armorMat);
  opTorso.position.y = 1.25;
  menuOperatorGroup.add(opTorso);

  const opHead = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.34), armorMat);
  opHead.position.y = 1.84;
  menuOperatorGroup.add(opHead);

  const opVisor = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.08, 0.05),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b })
  );
  opVisor.position.set(0, 1.85, 0.16);
  menuOperatorGroup.add(opVisor);

  const opLegL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.85, 0.24), armorMat);
  opLegL.position.set(-0.16, 0.42, 0);
  const opLegR = opLegL.clone();
  opLegR.position.x = 0.16;
  menuOperatorGroup.add(opLegL, opLegR);

  const opRifle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.88), darkMetalMat);
  opRifle.position.set(0.18, 1.15, 0.24);
  opRifle.rotation.x = 0.35;
  menuOperatorGroup.add(opRifle);

  menuStage.add(menuOperatorGroup);

  // Background buildings in Menu Diorama
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(7, 18 + i * 2, 7), modernBuildingMat);
    b.position.set(-10 + i * 4.8, 9, -10 - (i % 2) * 4);
    menuStage.add(b);
  }

  // Sun directional light
  const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.0);
  sunLight.position.set(30, 60, 20);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 180;
  sunLight.shadow.camera.left = -35;
  sunLight.shadow.camera.right = 35;
  sunLight.shadow.camera.top = 70;
  sunLight.shadow.camera.bottom = -70;
  scene.add(sunLight);

  return {
    worldGroup,
    colliders,
    walkableRoofs,
    windows,
    explosives,
    crates,
    doors,
    ammoPickups,
    medkitPickups,
    armorPickups,
    checkpoints,
    streetLights,
    indoorLights,
    emergencyLights,
    asphaltMaterial,
    extractionHelicopter,
    helicopterRotors: [mainRotor],
    dataDriveMesh,
    generatorPos,
    alarmTerminalPos,
    dataDrivePos,
    outpostGate,
    menuOperatorGroup,
    sunLight
  };
}

export function createEnemyEntity(
  id: string,
  archetype: EnemyArchetype,
  pos: THREE.Vector3,
  patrolPoints: THREE.Vector3[],
  district: number
): EnemyEntity {
  const group = new THREE.Group();
  group.position.copy(pos);

  // High-contrast, easily visible daylight enemy colors
  const colorMap: Record<EnemyArchetype, number> = {
    AGGRESSIVE: 0xd97706, // High-visibility amber tactical vest
    DEFENSIVE: 0x3b82f6,  // Blue urban camo
    TACTICAL: 0x6366f1,   // Indigo spec-ops
    SNIPER: 0x059669,     // Emerald marksman
    HEAVY: 0x475569       // Heavy reinforced armor
  };

  const scale = archetype === 'HEAVY' ? 1.18 : 1.0;
  group.scale.setScalar(scale);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: colorMap[archetype],
    roughness: 0.45,
    metalness: archetype === 'HEAVY' ? 0.7 : 0.3
  });
  const limbMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.7,
    metalness: 0.2
  });
  const headMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.4,
    metalness: 0.5
  });

  const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.74, 0.32), bodyMat);
  bodyMesh.position.y = 1.18;
  bodyMesh.userData = { enemyId: id, hitZone: 'BODY' };
  group.add(bodyMesh);

  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.32), headMat);
  headMesh.position.y = 1.75;
  headMesh.userData = { enemyId: id, hitZone: 'HEAD' };
  group.add(headMesh);

  // Visor with bright red glow
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.07, 0.04),
    new THREE.MeshBasicMaterial({ color: 0xef4444 })
  );
  visor.position.set(0, 1.76, 0.15);
  visor.userData = { enemyId: id, hitZone: 'HEAD' };
  group.add(visor);

  // Floating Alert Indicator `!` above head (becomes visible when spotting player)
  const alertMarker = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.35, 0.08),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b })
  );
  alertMarker.position.set(0, 2.25, 0);
  alertMarker.visible = false;
  group.add(alertMarker);

  const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.64, 0.18), limbMat);
  leftArmMesh.position.set(-0.38, 1.18, 0.1);
  leftArmMesh.userData = { enemyId: id, hitZone: 'ARMS' };
  group.add(leftArmMesh);

  const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.64, 0.18), limbMat);
  rightArmMesh.position.set(0.38, 1.18, 0.15);
  rightArmMesh.userData = { enemyId: id, hitZone: 'ARMS' };
  group.add(rightArmMesh);

  const gunMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.14, 0.68),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 })
  );
  gunMesh.position.set(0.32, 1.15, 0.38);
  group.add(gunMesh);

  const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.78, 0.22), limbMat);
  leftLegMesh.position.set(-0.16, 0.4, 0);
  leftLegMesh.userData = { enemyId: id, hitZone: 'LEGS' };
  group.add(leftLegMesh);

  const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.78, 0.22), limbMat);
  rightLegMesh.position.set(0.16, 0.4, 0);
  rightLegMesh.userData = { enemyId: id, hitZone: 'LEGS' };
  group.add(rightLegMesh);

  let laserLine: THREE.Line | undefined;
  if (archetype === 'SNIPER') {
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0.32, 1.2, 0.7),
      new THREE.Vector3(0.32, 1.2, 36)
    ]);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.75
    });
    laserLine = new THREE.Line(lineGeo, lineMat);
    group.add(laserLine);
  }

  const maxHp =
    archetype === 'HEAVY'
      ? 200
      : archetype === 'TACTICAL'
      ? 110
      : archetype === 'SNIPER'
      ? 75
      : 85;
  const baseSpeed =
    archetype === 'AGGRESSIVE'
      ? 5.8
      : archetype === 'HEAVY'
      ? 2.8
      : archetype === 'SNIPER'
      ? 3.4
      : 4.2;

  return {
    id,
    archetype,
    name: `${archetype} UNIT`,
    mesh: group,
    headMesh,
    bodyMesh,
    leftArmMesh,
    rightArmMesh,
    leftLegMesh,
    rightLegMesh,
    laserLine,
    alertMarkerMesh: alertMarker,
    position: pos.clone(),
    velocity: new THREE.Vector3(),
    patrolPoints,
    currentPatrolIdx: 0,
    hp: maxHp,
    maxHp,
    armor: archetype === 'HEAVY' ? 80 : archetype === 'TACTICAL' ? 30 : 0,
    speed: baseSpeed,
    baseSpeed,
    legDamaged: false,
    armDamaged: false,
    state: 'PATROL',
    stateTimer: 0,
    alertDelayTimer: 1.0, // Grace period before shooting!
    lastFireTime: 0,
    fireCooldown:
      archetype === 'SNIPER'
        ? 2.5
        : archetype === 'AGGRESSIVE'
        ? 0.7
        : archetype === 'HEAVY'
        ? 0.45
        : 1.0,
    stunTimer: 0,
    coverTarget: null,
    alertedSquad: false,
    district
  };
}

export function createCompanionEntity(startPos: THREE.Vector3): CompanionEntity {
  const group = new THREE.Group();
  group.position.copy(startPos);

  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    roughness: 0.4,
    metalness: 0.6
  });
  const cyanMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.74, 0.32), armorMat);
  body.position.y = 1.18;
  group.add(body);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.32), armorMat);
  head.position.y = 1.75;
  group.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.04), cyanMat);
  visor.position.set(0, 1.76, 0.16);
  group.add(visor);

  const shoulderBadge = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.36), cyanMat);
  shoulderBadge.position.y = 1.5;
  group.add(shoulderBadge);

  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.78, 0.24), armorMat);
  legs.position.y = 0.4;
  group.add(legs);

  const gunMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.15, 0.75),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 })
  );
  gunMesh.position.set(0.32, 1.15, 0.4);
  group.add(gunMesh);

  const muzzleLight = new THREE.PointLight(0x38bdf8, 0, 8);
  muzzleLight.position.set(0.32, 1.15, 0.8);
  group.add(muzzleLight);

  return {
    mesh: group,
    position: startPos.clone(),
    targetPosition: startPos.clone(),
    state: 'FOLLOW',
    lastFireTime: 0,
    lastCalloutTime: 0,
    muzzleLight
  };
}
