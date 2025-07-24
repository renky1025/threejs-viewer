/**
 * Three.js 灯光设置工具
 */
import * as THREE from 'three'

/**
 * 设置场景灯光
 * @param scene Three.js场景
 */
export function setupLighting(scene: THREE.Scene): void {
  // 环境光 - 提供基础照明
  const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
  scene.add(ambientLight)
  
  // 主方向光 - 模拟太阳光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(5, 10, 5)
  directionalLight.castShadow = true
  
  // 设置阴影参数
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  directionalLight.shadow.camera.near = 0.5
  directionalLight.shadow.camera.far = 50
  directionalLight.shadow.camera.left = -10
  directionalLight.shadow.camera.right = 10
  directionalLight.shadow.camera.top = 10
  directionalLight.shadow.camera.bottom = -10
  
  scene.add(directionalLight)
  
  // 补充光源 - 从另一个角度照亮物体
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
  fillLight.position.set(-5, 5, -5)
  scene.add(fillLight)
  
  // 点光源 - 增加局部亮点
  const pointLight = new THREE.PointLight(0xffffff, 0.5, 30)
  pointLight.position.set(0, 5, 0)
  scene.add(pointLight)
}