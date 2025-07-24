/**
 * Three.js 控制器工具
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

/**
 * 创建轨道控制器
 * @param camera 相机
 * @param renderer 渲染器
 * @returns 轨道控制器
 */
export function createOrbitControls(camera: THREE.Camera, renderer: THREE.WebGLRenderer): OrbitControls {
  const controls = new OrbitControls(camera, renderer.domElement)
  
  // 设置控制器参数
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.screenSpacePanning = false
  controls.minDistance = 1
  controls.maxDistance = 100
  controls.maxPolarAngle = Math.PI
  
  return controls
}

/**
 * 立方体控制器回调类型
 */
export type CubeControlCallback = (rotation: { x: number; y: number; z: number }) => void

/**
 * 创建立方体控制器
 * @param container 容器DOM元素
 * @param callback 旋转回调函数
 * @returns 清理函数
 */
export function createCubeControl(container: HTMLElement, callback: CubeControlCallback): () => void {
  // 创建立方体场景
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10)
  camera.position.set(2, 1.5, 3)
  camera.lookAt(0, 0, 0)
  
  // 创建渲染器
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(120, 120)
  renderer.setClearColor(0x000000, 0)
  
  // 创建立方体
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const materials = [
    new THREE.MeshBasicMaterial({ color: 0xff0000 }), // 右
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // 左
    new THREE.MeshBasicMaterial({ color: 0x0000ff }), // 上
    new THREE.MeshBasicMaterial({ color: 0xffff00 }), // 下
    new THREE.MeshBasicMaterial({ color: 0xff00ff }), // 前
    new THREE.MeshBasicMaterial({ color: 0x00ffff })  // 后
  ]
  
  const cube = new THREE.Mesh(geometry, materials)
  scene.add(cube)
  
  // 添加灯光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
  scene.add(ambientLight)
  
  // 将渲染器添加到容器
  container.appendChild(renderer.domElement)
  
  // 鼠标交互
  let isMouseDown = false
  let mouseX = 0
  let mouseY = 0
  
  const onMouseDown = (event: MouseEvent) => {
    isMouseDown = true
    mouseX = event.clientX
    mouseY = event.clientY
  }
  
  const onMouseMove = (event: MouseEvent) => {
    if (!isMouseDown) return
    
    const deltaX = event.clientX - mouseX
    const deltaY = event.clientY - mouseY
    
    cube.rotation.y += deltaX * 0.01
    cube.rotation.x += deltaY * 0.01
    
    // 调用回调函数
    callback({
      x: cube.rotation.x,
      y: cube.rotation.y,
      z: cube.rotation.z
    })
    
    mouseX = event.clientX
    mouseY = event.clientY
    
    renderer.render(scene, camera)
  }
  
  const onMouseUp = () => {
    isMouseDown = false
  }
  
  // 添加事件监听器
  renderer.domElement.addEventListener('mousedown', onMouseDown)
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  
  // 初始渲染
  renderer.render(scene, camera)
  
  // 返回清理函数
  return () => {
    renderer.domElement.removeEventListener('mousedown', onMouseDown)
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    
    if (container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement)
    }
    
    geometry.dispose()
    materials.forEach(material => material.dispose())
    renderer.dispose()
  }
}