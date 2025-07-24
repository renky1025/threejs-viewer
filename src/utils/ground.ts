/**
 * 地面实现
 */
import * as THREE from 'three';
import { GridHelper } from 'three';
import type { GroundType } from './types';

/**
 * 创建地面
 * @param scene Three.js场景
 * @param type 地面类型
 * @returns 地面网格对象
 */
export function createGround(scene: THREE.Scene, type: GroundType): THREE.Object3D {
  // 创建一个组来包含地面和网格
  const groundGroup = new THREE.Group();

  // 创建平面几何体
  const geometry = new THREE.PlaneGeometry(40, 40);
  let material: THREE.Material;

  switch (type) {
    case 'floor':
      // 木地板材质
      const textureLoader = new THREE.TextureLoader();
      const floorTexture = textureLoader.load('/assets/wood.jpg');
      floorTexture.wrapS = THREE.RepeatWrapping;
      floorTexture.wrapT = THREE.RepeatWrapping;
      floorTexture.repeat.set(10, 10);

      const normalMap = textureLoader.load('/assets/wood_floor_normal.jpg');
      normalMap.wrapS = THREE.RepeatWrapping;
      normalMap.wrapT = THREE.RepeatWrapping;
      normalMap.repeat.set(10, 10);

      material = new THREE.MeshStandardMaterial({
        map: floorTexture,
        normalMap: normalMap,
        roughness: 0.8,
        metalness: 0.2
      });
      break;

    case 'grass':
      // 草地材质
      const grassLoader = new THREE.TextureLoader();
      const grassTexture = grassLoader.load('/assets/grass.jpg');
      grassTexture.wrapS = THREE.RepeatWrapping;
      grassTexture.wrapT = THREE.RepeatWrapping;
      grassTexture.repeat.set(10, 10);

      material = new THREE.MeshStandardMaterial({
        map: grassTexture,
        roughness: 1.0
      });
      break;

    default:
      // 默认材质 - 半透明白色
      material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.5,
        metalness: 0.1,
        transparent: true,
        opacity: 0.6
      });
      break;
  }

  // 创建地面网格
  const groundMesh = new THREE.Mesh(geometry, material);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  groundGroup.add(groundMesh);

  // 添加网格辅助线 - 默认情况下总是添加
  const gridSize = 40;
  const gridDivisions = 40;
  const gridHelper = new GridHelper(gridSize, gridDivisions, 0x888888, 0xffffff);
  gridHelper.position.y = 0.01; // 稍微抬高网格，避免z-fighting
  groundGroup.add(gridHelper);

  // 将整个组添加到场景
  scene.add(groundGroup);

  return groundGroup;
}