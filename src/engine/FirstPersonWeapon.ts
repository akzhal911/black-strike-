import * as THREE from 'three';
import { WeaponAttachmentState, WeaponId } from '../types/game';
import { WEAPON_SKINS } from '../data/weaponsAndMissions';

export class FirstPersonWeaponRig {
  public root: THREE.Group;
  private weaponGroup: THREE.Group;
  private muzzleFlashMesh: THREE.Mesh;
  public muzzleLight: THREE.PointLight;
  public ejectionPortLocal = new THREE.Vector3(0.06, 0.04, -0.35);

  private swayX = 0;
  private swayY = 0;
  private recoilKickZ = 0;
  private recoilPitch = 0;
  private adsProgress = 0;
  private reloadProgress = 0;
  private sprintProgress = 0;
  private muzzleTimer = 0;

  constructor() {
    this.root = new THREE.Group();
    this.weaponGroup = new THREE.Group();
    this.root.add(this.weaponGroup);

    // Muzzle flash star geometry
    const flashGeo = new THREE.ConeGeometry(0.055, 0.18, 6);
    flashGeo.rotateX(Math.PI / 2);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffb74d,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthTest: false
    });
    this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
    this.muzzleFlashMesh.visible = false;
    this.weaponGroup.add(this.muzzleFlashMesh);

    this.muzzleLight = new THREE.PointLight(0xffa726, 0, 8);
    this.muzzleLight.position.set(0.2, -0.1, -0.9);
    this.root.add(this.muzzleLight);
  }

  public buildWeaponModel(weaponId: WeaponId, attachment: WeaponAttachmentState) {
    // Clear previous children except muzzleFlashMesh
    while (this.weaponGroup.children.length > 0) {
      const child = this.weaponGroup.children[0];
      this.weaponGroup.remove(child);
    }
    this.weaponGroup.add(this.muzzleFlashMesh);

    const skin = WEAPON_SKINS[attachment.skin] || WEAPON_SKINS.carbon;

    const primaryMat = new THREE.MeshStandardMaterial({
      color: skin.primaryHex,
      roughness: 0.35,
      metalness: 0.78
    });
    const secondaryMat = new THREE.MeshStandardMaterial({
      color: skin.secondaryHex,
      roughness: 0.5,
      metalness: 0.45
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: skin.accentHex,
      roughness: 0.3,
      metalness: 0.8,
      emissive: skin.accentHex,
      emissiveIntensity: 0.15
    });
    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0x181b20,
      roughness: 0.8,
      metalness: 0.1
    });
    const sleeveMat = new THREE.MeshStandardMaterial({
      color: 0x222933,
      roughness: 0.85,
      metalness: 0.05
    });

    // Build tactical arms/gloves
    const rightForearm = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.065, 0.32), sleeveMat);
    rightForearm.position.set(0.06, -0.11, 0.16);
    rightForearm.rotation.x = 0.15;
    this.weaponGroup.add(rightForearm);

    const rightGlove = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.07, 0.09), gloveMat);
    rightGlove.position.set(0.0, -0.08, -0.02);
    this.weaponGroup.add(rightGlove);

    const leftForearm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.36), sleeveMat);
    leftForearm.position.set(-0.08, -0.1, -0.16);
    leftForearm.rotation.y = -0.32;
    leftForearm.rotation.x = 0.22;
    this.weaponGroup.add(leftForearm);

    const leftGlove = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.065, 0.095), gloveMat);
    leftGlove.position.set(0.0, -0.045, -0.32);
    this.weaponGroup.add(leftGlove);

    let barrelEndZ = -0.72;

    if (weaponId === 'assault_rifle') {
      // Upper & Lower Receiver
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.088, 0.36), primaryMat);
      receiver.position.set(0, 0, -0.12);
      this.weaponGroup.add(receiver);

      // Handguard rail with vent slots
      const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.068, 0.32), secondaryMat);
      handguard.position.set(0, 0.006, -0.44);
      this.weaponGroup.add(handguard);

      // Accent rail strip
      const railAccent = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.008, 0.28), accentMat);
      railAccent.position.set(0, 0.044, -0.38);
      this.weaponGroup.add(railAccent);

      // Barrel
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 12), primaryMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.012, -0.64);
      this.weaponGroup.add(barrel);

      // Stock
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.095, 0.22), secondaryMat);
      stock.position.set(0, -0.01, 0.14);
      this.weaponGroup.add(stock);

      // Magazine
      const magLen = attachment.magazine === 'extended' ? 0.21 : 0.15;
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.042, magLen, 0.068), secondaryMat);
      mag.position.set(0, -0.11, -0.2);
      mag.rotation.x = 0.18;
      this.weaponGroup.add(mag);

      barrelEndZ = -0.78;
    } else if (weaponId === 'smg') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.082, 0.32), primaryMat);
      body.position.set(0, 0, -0.18);
      this.weaponGroup.add(body);

      const foregrip = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.09, 0.038), secondaryMat);
      foregrip.position.set(0, -0.075, -0.31);
      this.weaponGroup.add(foregrip);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.16, 12), primaryMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.01, -0.4);
      this.weaponGroup.add(barrel);

      const magLen = attachment.magazine === 'extended' ? 0.23 : 0.16;
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.034, magLen, 0.045), accentMat);
      mag.position.set(0, -0.11, -0.08);
      mag.rotation.x = 0.1;
      this.weaponGroup.add(mag);

      barrelEndZ = -0.49;
    } else if (weaponId === 'shotgun') {
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.086, 0.38), primaryMat);
      receiver.position.set(0, 0, -0.14);
      this.weaponGroup.add(receiver);

      // Heavy dual barrel + tube
      const topBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.52, 12), primaryMat);
      topBarrel.rotation.x = Math.PI / 2;
      topBarrel.position.set(0, 0.022, -0.56);
      this.weaponGroup.add(topBarrel);

      const underTube = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.46, 12), secondaryMat);
      underTube.rotation.x = Math.PI / 2;
      underTube.position.set(0, -0.012, -0.53);
      this.weaponGroup.add(underTube);

      const pump = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.052, 0.18), accentMat);
      pump.position.set(0, -0.015, -0.44);
      this.weaponGroup.add(pump);

      barrelEndZ = -0.83;
    } else if (weaponId === 'sniper') {
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.085, 0.48), primaryMat);
      chassis.position.set(0, 0, -0.22);
      this.weaponGroup.add(chassis);

      const flutedBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.58, 12), secondaryMat);
      flutedBarrel.rotation.x = Math.PI / 2;
      flutedBarrel.position.set(0, 0.018, -0.72);
      this.weaponGroup.add(flutedBarrel);

      const muzzleBrake = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.032, 0.075), accentMat);
      muzzleBrake.position.set(0, 0.018, -1.02);
      this.weaponGroup.add(muzzleBrake);

      // High-power scope
      const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.02, 0.28, 16), secondaryMat);
      scopeTube.rotation.x = Math.PI / 2;
      scopeTube.position.set(0, 0.075, -0.2);
      this.weaponGroup.add(scopeTube);

      const lens = new THREE.Mesh(
        new THREE.CircleGeometry(0.019, 16),
        new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.65 })
      );
      lens.position.set(0, 0.075, -0.059);
      this.weaponGroup.add(lens);

      barrelEndZ = -1.06;
    } else {
      // Pistol
      const slide = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.048, 0.22), primaryMat);
      slide.position.set(0, 0.015, -0.16);
      this.weaponGroup.add(slide);

      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.1, 0.055), secondaryMat);
      grip.position.set(0, -0.05, -0.08);
      grip.rotation.x = 0.22;
      this.weaponGroup.add(grip);

      const laserModule = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.024, 0.07), accentMat);
      laserModule.position.set(0, -0.015, -0.21);
      this.weaponGroup.add(laserModule);

      barrelEndZ = -0.29;
    }

    // Optic attachment for non-sniper weapons
    if (weaponId !== 'sniper' && attachment.optic !== 'iron') {
      const sightHousing = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.042, 0.075), secondaryMat);
      sightHousing.position.set(0, 0.062, -0.16);
      this.weaponGroup.add(sightHousing);

      const reticleDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.0035, 8, 8),
        new THREE.MeshBasicMaterial({ color: attachment.optic === 'holo' ? 0xef4444 : 0x10b981 })
      );
      reticleDot.position.set(0, 0.064, -0.16);
      this.weaponGroup.add(reticleDot);
    }

    // Muzzle suppressor or compensator
    if (attachment.muzzle === 'suppressor') {
      const sup = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.17, 14), secondaryMat);
      sup.rotation.x = Math.PI / 2;
      sup.position.set(0, 0.015, barrelEndZ - 0.07);
      this.weaponGroup.add(sup);
      barrelEndZ -= 0.16;
    }

    this.muzzleFlashMesh.position.set(0, 0.015, barrelEndZ - 0.06);
  }

  public addLookSway(dx: number, dy: number) {
    this.swayX = THREE.MathUtils.clamp(this.swayX - dx * 0.14, -0.045, 0.045);
    this.swayY = THREE.MathUtils.clamp(this.swayY + dy * 0.14, -0.045, 0.045);
  }

  public triggerFire(recoilVert: number) {
    this.recoilKickZ = Math.min(0.095, this.recoilKickZ + 0.045 + recoilVert * 0.5);
    this.recoilPitch = Math.min(0.18, this.recoilPitch + recoilVert * 1.9);
    this.muzzleTimer = 0.055;
    this.muzzleFlashMesh.visible = true;
    this.muzzleFlashMesh.rotation.z = Math.random() * Math.PI * 2;
    this.muzzleLight.intensity = 4.2;
  }

  public update(
    dt: number,
    time: number,
    isMoving: boolean,
    isSprinting: boolean,
    isAds: boolean,
    isReloading: boolean,
    weaponId: WeaponId
  ) {
    // Muzzle flash decay
    if (this.muzzleTimer > 0) {
      this.muzzleTimer -= dt;
      if (this.muzzleTimer <= 0) {
        this.muzzleFlashMesh.visible = false;
        this.muzzleLight.intensity = 0;
      }
    }

    // Smoothly interpolate states
    const targetAds = isAds && !isReloading && !isSprinting ? 1 : 0;
    this.adsProgress = THREE.MathUtils.lerp(this.adsProgress, targetAds, Math.min(1, dt * 14));

    const targetReload = isReloading ? 1 : 0;
    this.reloadProgress = THREE.MathUtils.lerp(this.reloadProgress, targetReload, Math.min(1, dt * 10));

    const targetSprint = isSprinting && isMoving && !isAds && !isReloading ? 1 : 0;
    this.sprintProgress = THREE.MathUtils.lerp(this.sprintProgress, targetSprint, Math.min(1, dt * 10));

    // Recover sway & recoil
    this.swayX = THREE.MathUtils.lerp(this.swayX, 0, Math.min(1, dt * 10));
    this.swayY = THREE.MathUtils.lerp(this.swayY, 0, Math.min(1, dt * 10));
    this.recoilKickZ = THREE.MathUtils.lerp(this.recoilKickZ, 0, Math.min(1, dt * 14));
    this.recoilPitch = THREE.MathUtils.lerp(this.recoilPitch, 0, Math.min(1, dt * 12));

    // Hide viewmodel when fully scoped in on sniper rifle for crisp reticle overlay
    this.weaponGroup.visible = !(weaponId === 'sniper' && this.adsProgress > 0.85);

    // Base hip vs ADS position
    const hipX = 0.22;
    const hipY = -0.21;
    const hipZ = -0.34;

    const adsX = 0.0;
    const adsY = weaponId === 'pistol' ? -0.115 : -0.135;
    const adsZ = -0.24;

    let posX = THREE.MathUtils.lerp(hipX, adsX, this.adsProgress);
    let posY = THREE.MathUtils.lerp(hipY, adsY, this.adsProgress);
    let posZ = THREE.MathUtils.lerp(hipZ, adsZ, this.adsProgress);

    // Walk / Sprint bobbing
    const bobSpeed = isSprinting ? 13 : isMoving ? 8.5 : 1.6;
    const bobAmp = (isSprinting ? 0.018 : isMoving ? 0.008 : 0.002) * (1 - this.adsProgress * 0.75);
    posX += Math.cos(time * bobSpeed * 0.5) * bobAmp + this.swayX * (1 - this.adsProgress * 0.6);
    posY += Math.abs(Math.sin(time * bobSpeed)) * bobAmp + this.swayY * (1 - this.adsProgress * 0.6);

    // Apply recoil kick
    posZ += this.recoilKickZ;

    // Reload dip
    posY -= this.reloadProgress * 0.14;

    this.weaponGroup.position.set(posX, posY, posZ);

    // Rotations (recoil + sprint + reload)
    const rotX =
      this.recoilPitch -
      this.sprintProgress * 0.26 -
      this.reloadProgress * 0.55 +
      this.swayY * 0.8;
    const rotY = this.sprintProgress * 0.42 + this.swayX * 1.1;
    const rotZ = -this.sprintProgress * 0.18 + this.reloadProgress * 0.45;

    this.weaponGroup.rotation.set(rotX, rotY, rotZ);
  }
}
