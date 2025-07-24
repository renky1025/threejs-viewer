/**
 * 天空盒实现
 */
import * as THREE from 'three';

/**
 * 创建渐变蓝色天空盒
 * @param scene Three.js场景
 */
export function createRealisticSky(scene: THREE.Scene): void {
  try {
    // 使用Canvas创建渐变纹理
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('无法获取canvas context');
    }

    // 创建垂直渐变
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#4a90e2');    // 顶部深蓝色
    gradient.addColorStop(1, '#ffffff');    // 底部浅蓝色

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // 创建纹理
    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;

    // 设置为场景背景
    scene.background = texture;

  } catch (error) {
    console.warn('渐变天空创建失败，使用纯色背景:', error);
    // 备选方案：使用纯色背景
    scene.background = new THREE.Color(0x87ceeb);
  }
}

/**
 * 创建简单的天空盒
 * @param scene Three.js场景
 */
export function createSimpleSky(scene: THREE.Scene): void {
  scene.background = new THREE.Color(0x87ceeb);
}