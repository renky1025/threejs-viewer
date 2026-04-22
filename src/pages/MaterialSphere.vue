<template>
  <div class="material-sphere-page">
    <!-- 顶部导航栏 -->
    <div class="nav-header">
      <div class="nav-left">
        <el-button type="primary" @click="goHome" circle>
          <el-icon><HomeFilled /></el-icon>
        </el-button>
        <h1 class="page-title">材质球展示</h1>
      </div>
      <div class="nav-right">
        <el-tag type="info" effect="plain">Three.js Material Showcase</el-tag>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 3D 场景容器 -->
      <div ref="sceneContainer" class="scene-container"></div>

      <!-- 左侧控制面板 - 光照设置 -->
      <div class="control-panel left-panel">
        <h3 class="panel-title">
          <el-icon><Sunny /></el-icon>
          光照设置
        </h3>

        <div class="control-section">
          <div class="control-row">
            <span class="label">环境光强度</span>
            <el-slider v-model="lighting.ambientIntensity" :min="0" :max="2" :step="0.1" show-input />
          </div>

          <div class="control-row">
            <span class="label">主光源强度</span>
            <el-slider v-model="lighting.mainIntensity" :min="0" :max="3" :step="0.1" show-input />
          </div>

          <div class="control-row">
            <span class="label">主光源颜色</span>
            <el-color-picker v-model="lighting.mainColor" show-alpha />
          </div>

          <div class="control-row">
            <span class="label">光源位置 X</span>
            <el-slider v-model="lighting.mainPosition[0]" :min="-10" :max="10" :step="0.5" />
          </div>

          <div class="control-row">
            <span class="label">光源位置 Y</span>
            <el-slider v-model="lighting.mainPosition[1]" :min="-10" :max="10" :step="0.5" />
          </div>

          <div class="control-row">
            <span class="label">光源位置 Z</span>
            <el-slider v-model="lighting.mainPosition[2]" :min="-10" :max="10" :step="0.5" />
          </div>

          <div class="control-row">
            <span class="label">辅助光强度</span>
            <el-slider v-model="lighting.fillIntensity" :min="0" :max="2" :step="0.1" show-input />
          </div>

          <div class="control-row">
            <span class="label">辅助光颜色</span>
            <el-color-picker v-model="lighting.fillColor" show-alpha />
          </div>
        </div>

        <el-divider />

        <h3 class="panel-title">
          <el-icon><Moon /></el-icon>
          阴影设置
        </h3>

        <div class="control-section">
          <div class="control-row">
            <el-switch v-model="shadows.enabled" active-text="启用阴影" />
          </div>

          <div v-if="shadows.enabled" class="control-row">
            <span class="label">阴影模糊</span>
            <el-slider v-model="shadows.radius" :min="0" :max="10" :step="0.5" />
          </div>

          <div v-if="shadows.enabled" class="control-row">
            <span class="label">阴影分辨率</span>
            <el-select v-model="shadows.mapSize" size="small">
              <el-option label="512x512" :value="512" />
              <el-option label="1024x1024" :value="1024" />
              <el-option label="2048x2048" :value="2048" />
              <el-option label="4096x4096" :value="4096" />
            </el-select>
          </div>
        </div>
      </div>

      <!-- 右侧面板 - 材质选择 -->
      <div class="control-panel right-panel">
        <h3 class="panel-title">
          <el-icon><Box /></el-icon>
          材质选择
        </h3>

        <div class="material-grid">
          <div
            v-for="mat in materialPresets"
            :key="mat.name"
            class="material-card"
            :class="{ active: currentMaterial === mat.name }"
            @click="applyMaterial(mat)"
          >
            <div class="material-preview" :style="getMaterialPreviewStyle(mat)">
              <div class="sphere-preview"></div>
            </div>
            <span class="material-name">{{ mat.name }}</span>
            <span class="material-desc">{{ mat.description }}</span>
          </div>
        </div>

        <el-divider />

        <h3 class="panel-title">当前材质属性</h3>

        <div class="control-section">
          <div class="control-row">
            <span class="label">基础颜色</span>
            <el-color-picker v-model="materialProps.color" show-alpha @change="updateMaterial" />
          </div>

          <div class="control-row">
            <span class="label">金属度</span>
            <el-slider v-model="materialProps.metalness" :min="0" :max="1" :step="0.01" show-input />
          </div>

          <div class="control-row">
            <span class="label">粗糙度</span>
            <el-slider v-model="materialProps.roughness" :min="0" :max="1" :step="0.01" show-input />
          </div>

          <div class="control-row">
            <span class="label">透明度</span>
            <el-slider v-model="materialProps.opacity" :min="0" :max="1" :step="0.01" show-input />
          </div>

          <div class="control-row">
            <span class="label">自发光</span>
            <el-color-picker v-model="materialProps.emissive" show-alpha @change="updateMaterial" />
          </div>

          <div class="control-row">
            <span class="label">自发光强度</span>
            <el-slider v-model="materialProps.emissiveIntensity" :min="0" :max="2" :step="0.1" show-input />
          </div>

          <div class="control-row">
            <el-switch v-model="materialProps.wireframe" active-text="线框模式" @change="updateMaterial" />
          </div>
        </div>

        <el-divider />

        <div class="action-buttons">
          <el-button type="primary" @click="resetScene" plain>
            <el-icon><RefreshRight /></el-icon>
            重置场景
          </el-button>
          <el-button @click="toggleRotation">
            <el-icon><VideoPlay v-if="!isRotating" /><VideoPause v-else /></el-icon>
            {{ isRotating ? '停止旋转' : '自动旋转' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="info-footer">
      <span>拖动鼠标旋转视角 | 滚轮缩放 | 右键平移</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import {
  HomeFilled, Sunny, Moon, Box, RefreshRight,
  VideoPlay, VideoPause
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const sceneContainer = ref<HTMLDivElement>()

// Three.js 相关
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let controls: OrbitControls | null = null
let mainLight: THREE.DirectionalLight | null = null
let fillLight: THREE.DirectionalLight | null = null
let ambientLight: THREE.AmbientLight | null = null
let spheres: THREE.Mesh[] = []
let animationId: number | null = null
let groundPlane: THREE.Mesh | null = null

// 状态
const isRotating = ref(true)
const currentMaterial = ref('标准金属')

// 光照设置
const lighting = reactive({
  ambientIntensity: 0.4,
  mainIntensity: 1.5,
  mainColor: '#ffffff',
  mainPosition: [5, 10, 5] as [number, number, number],
  fillIntensity: 0.5,
  fillColor: '#88ccff'
})

// 阴影设置
const shadows = reactive({
  enabled: true,
  radius: 4,
  mapSize: 2048
})

// 材质属性
const materialProps = reactive({
  color: '#ff6b6b',
  metalness: 0.7,
  roughness: 0.3,
  opacity: 1,
  emissive: '#000000',
  emissiveIntensity: 0,
  wireframe: false
})

// 材质预设
const materialPresets = [
  {
    name: '标准金属',
    description: '高金属度，中等粗糙度',
    props: { color: '#ff6b6b', metalness: 0.9, roughness: 0.2, emissive: '#000000', emissiveIntensity: 0 }
  },
  {
    name: '磨砂金属',
    description: '高金属度，高粗糙度',
    props: { color: '#4ecdc4', metalness: 0.8, roughness: 0.6, emissive: '#000000', emissiveIntensity: 0 }
  },
  {
    name: '镜面抛光',
    description: '高金属度，低粗糙度',
    props: { color: '#ffd93d', metalness: 1.0, roughness: 0.05, emissive: '#000000', emissiveIntensity: 0 }
  },
  {
    name: '塑料质感',
    description: '低金属度，中等粗糙度',
    props: { color: '#6c5ce7', metalness: 0.1, roughness: 0.4, emissive: '#000000', emissiveIntensity: 0 }
  },
  {
    name: '陶瓷质感',
    description: '无金属，光滑表面',
    props: { color: '#ffffff', metalness: 0.0, roughness: 0.1, emissive: '#000000', emissiveIntensity: 0 }
  },
  {
    name: '霓虹发光',
    description: '自发光材质',
    props: { color: '#00b894', metalness: 0.3, roughness: 0.4, emissive: '#00b894', emissiveIntensity: 0.8 }
  },
  {
    name: '磨砂塑料',
    description: '低金属度，高粗糙度',
    props: { color: '#e17055', metalness: 0.0, roughness: 0.8, emissive: '#000000', emissiveIntensity: 0 }
  },
  {
    name: '黄金质感',
    description: '金黄色，高反射',
    props: { color: '#ffd700', metalness: 1.0, roughness: 0.15, emissive: '#000000', emissiveIntensity: 0 }
  },
  {
    name: '银白金属',
    description: '银白色，镜面效果',
    props: { color: '#c0c0c0', metalness: 1.0, roughness: 0.1, emissive: '#000000', emissiveIntensity: 0 }
  },
  {
    name: '青铜质感',
    description: '青铜色，复古感',
    props: { color: '#cd7f32', metalness: 0.8, roughness: 0.3, emissive: '#000000', emissiveIntensity: 0 }
  },
  {
    name: '紫水晶',
    description: '半透明宝石质感',
    props: { color: '#9b59b6', metalness: 0.1, roughness: 0.1, emissive: '#6c3483', emissiveIntensity: 0.3 }
  },
  {
    name: '红宝石',
    description: '深红色宝石',
    props: { color: '#e74c3c', metalness: 0.2, roughness: 0.05, emissive: '#922b21', emissiveIntensity: 0.2 }
  }
]

// 颜色转换
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { r: 1, g: 1, b: 1 }
  const r = result[1] ? parseInt(result[1], 16) / 255 : 1
  const g = result[2] ? parseInt(result[2], 16) / 255 : 1
  const b = result[3] ? parseInt(result[3], 16) / 255 : 1
  return { r, g, b }
}

// 材质预览样式
function getMaterialPreviewStyle(mat: typeof materialPresets[0]) {
  return {
    background: `radial-gradient(circle at 30% 30%, ${mat.props.color}, ${darkenColor(mat.props.color, 0.3)})`
  }
}

function darkenColor(hex: string, factor: number) {
  const rgb = hexToRgb(hex)
  const r = Math.max(0, Math.floor((rgb.r - factor) * 255))
  const g = Math.max(0, Math.floor((rgb.g - factor) * 255))
  const b = Math.max(0, Math.floor((rgb.b - factor) * 255))
  return `rgb(${r}, ${g}, ${b})`
}

// 初始化场景
function initScene() {
  if (!sceneContainer.value) return

  const container = sceneContainer.value
  const width = container.clientWidth
  const height = container.clientHeight

  // 场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)
  scene.fog = new THREE.Fog(0x1a1a2e, 10, 50)

  // 相机
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
  camera.position.set(0, 5, 12)

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  container.appendChild(renderer.domElement)

  // 控制器
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 3
  controls.maxDistance = 30
  controls.maxPolarAngle = Math.PI / 2 - 0.05

  // 创建灯光
  createLights()

  // 创建材质球
  createSpheres()

  // 创建地面
  createGround()

  // 开始动画
  animate()

  // 监听窗口大小变化
  window.addEventListener('resize', onResize)
}

// 创建灯光
function createLights() {
  if (!scene) return

  // 环境光
  ambientLight = new THREE.AmbientLight(
    0xffffff,
    lighting.ambientIntensity
  )
  scene.add(ambientLight)

  // 主光源
  mainLight = new THREE.DirectionalLight(
    new THREE.Color(lighting.mainColor),
    lighting.mainIntensity
  )
  mainLight.position.set(...lighting.mainPosition)
  mainLight.castShadow = shadows.enabled
  mainLight.shadow.mapSize.width = shadows.mapSize
  mainLight.shadow.mapSize.height = shadows.mapSize
  mainLight.shadow.camera.near = 0.5
  mainLight.shadow.camera.far = 50
  mainLight.shadow.camera.left = -10
  mainLight.shadow.camera.right = 10
  mainLight.shadow.camera.top = 10
  mainLight.shadow.camera.bottom = -10
  mainLight.shadow.radius = shadows.radius
  mainLight.shadow.bias = -0.001
  scene.add(mainLight)

  // 辅助光
  fillLight = new THREE.DirectionalLight(
    new THREE.Color(lighting.fillColor),
    lighting.fillIntensity
  )
  fillLight.position.set(-5, 3, -5)
  scene.add(fillLight)
}

// 创建材质球
function createSpheres() {
  if (!scene) return

  // 清除旧的球体
  spheres.forEach(sphere => {
    scene?.remove(sphere)
    sphere.geometry.dispose()
    if (Array.isArray(sphere.material)) {
      sphere.material.forEach(m => m.dispose())
    } else {
      sphere.material.dispose()
    }
  })
  spheres = []

  // 创建网格排列的球体
  const rows = 2
  const cols = 3
  const spacing = 2.5

  const geometry = new THREE.SphereGeometry(1, 64, 64)

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const material = createMaterial()
      const sphere = new THREE.Mesh(geometry.clone(), material)

      sphere.position.x = (col - (cols - 1) / 2) * spacing
      sphere.position.y = 1 + row * spacing * 0.8
      sphere.position.z = (row - (rows - 1) / 2) * spacing * 0.5

      sphere.castShadow = true
      sphere.receiveShadow = true

      scene.add(sphere)
      spheres.push(sphere)
    }
  }

  // 中间大球
  const centerMaterial = createMaterial()
  const centerGeometry = new THREE.SphereGeometry(1.5, 128, 128)
  const centerSphere = new THREE.Mesh(centerGeometry, centerMaterial)
  centerSphere.position.set(0, 1.5, 0)
  centerSphere.castShadow = true
  centerSphere.receiveShadow = true
  scene.add(centerSphere)
  spheres.push(centerSphere)
}

// 创建材质
function createMaterial(): THREE.MeshStandardMaterial {
  const rgb = hexToRgb(materialProps.color)
  const emissiveRgb = hexToRgb(materialProps.emissive)

  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(rgb.r, rgb.g, rgb.b),
    metalness: materialProps.metalness,
    roughness: materialProps.roughness,
    opacity: materialProps.opacity,
    transparent: materialProps.opacity < 1,
    emissive: new THREE.Color(emissiveRgb.r, emissiveRgb.g, emissiveRgb.b),
    emissiveIntensity: materialProps.emissiveIntensity,
    wireframe: materialProps.wireframe,
    side: THREE.DoubleSide
  })
}

// 创建地面
function createGround() {
  if (!scene) return

  const geometry = new THREE.PlaneGeometry(50, 50)
  const material = new THREE.MeshStandardMaterial({
    color: 0x2d3436,
    roughness: 0.8,
    metalness: 0.2
  })

  groundPlane = new THREE.Mesh(geometry, material)
  groundPlane.rotation.x = -Math.PI / 2
  groundPlane.receiveShadow = true
  scene.add(groundPlane)

  // 网格辅助线
  const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x333333)
  gridHelper.position.y = 0.01
  scene.add(gridHelper)
}

// 更新材质
function updateMaterial() {
  const newMaterial = createMaterial()

  spheres.forEach(sphere => {
    const oldMaterial = sphere.material as THREE.Material
    sphere.material = newMaterial.clone()
    oldMaterial.dispose()
  })
}

// 应用预设材质
function applyMaterial(preset: typeof materialPresets[0]) {
  currentMaterial.value = preset.name

  materialProps.color = preset.props.color
  materialProps.metalness = preset.props.metalness
  materialProps.roughness = preset.props.roughness
  materialProps.emissive = preset.props.emissive
  materialProps.emissiveIntensity = preset.props.emissiveIntensity

  updateMaterial()
  ElMessage.success(`已应用材质: ${preset.name}`)
}

// 更新灯光
function updateLights() {
  if (!ambientLight || !mainLight || !fillLight) return

  ambientLight.intensity = lighting.ambientIntensity

  mainLight.intensity = lighting.mainIntensity
  mainLight.color.set(lighting.mainColor)
  mainLight.position.set(...lighting.mainPosition)

  fillLight.intensity = lighting.fillIntensity
  fillLight.color.set(lighting.fillColor)
}

// 更新阴影
function updateShadows() {
  if (!mainLight) return

  mainLight.castShadow = shadows.enabled
  mainLight.shadow.mapSize.width = shadows.mapSize
  mainLight.shadow.mapSize.height = shadows.mapSize
  mainLight.shadow.radius = shadows.radius

  if (renderer) {
    renderer.shadowMap.enabled = shadows.enabled
  }
}

// 动画循环
function animate() {
  animationId = requestAnimationFrame(animate)

  if (isRotating.value && controls) {
    controls.autoRotate = true
    controls.autoRotateSpeed = 1.0
  } else if (controls) {
    controls.autoRotate = false
  }

  controls?.update()
  renderer?.render(scene!, camera!)
}

// 窗口大小变化处理
function onResize() {
  if (!sceneContainer.value || !camera || !renderer) return

  const width = sceneContainer.value.clientWidth
  const height = sceneContainer.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

// 切换旋转
function toggleRotation() {
  isRotating.value = !isRotating.value
}

// 重置场景
function resetScene() {
  lighting.ambientIntensity = 0.4
  lighting.mainIntensity = 1.5
  lighting.mainColor = '#ffffff'
  lighting.mainPosition = [5, 10, 5]
  lighting.fillIntensity = 0.5
  lighting.fillColor = '#88ccff'

  shadows.enabled = true
  shadows.radius = 4
  shadows.mapSize = 2048

  materialProps.color = '#ff6b6b'
  materialProps.metalness = 0.7
  materialProps.roughness = 0.3
  materialProps.opacity = 1
  materialProps.emissive = '#000000'
  materialProps.emissiveIntensity = 0
  materialProps.wireframe = false

  currentMaterial.value = '标准金属'

  updateLights()
  updateShadows()
  updateMaterial()

  if (camera && controls) {
    camera.position.set(0, 5, 12)
    controls.target.set(0, 0, 0)
    controls.update()
  }

  ElMessage.success('场景已重置')
}

// 导航到首页
function goHome() {
  router.push('/')
}

// 销毁资源
function dispose() {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }

  window.removeEventListener('resize', onResize)

  spheres.forEach(sphere => {
    sphere.geometry.dispose()
    if (Array.isArray(sphere.material)) {
      sphere.material.forEach(m => m.dispose())
    } else {
      sphere.material.dispose()
    }
  })
  spheres = []

  controls?.dispose()

  if (renderer) {
    renderer.dispose()
    if (renderer.domElement.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement)
    }
  }
}

// 监听变化
watch(lighting, updateLights, { deep: true })
watch(shadows, updateShadows, { deep: true })
watch(
  () => [
    materialProps.color,
    materialProps.metalness,
    materialProps.roughness,
    materialProps.opacity,
    materialProps.emissive,
    materialProps.emissiveIntensity,
    materialProps.wireframe
  ],
  updateMaterial,
  { deep: true }
)

// 生命周期
onMounted(initScene)
onBeforeUnmount(dispose)
</script>

<style scoped>
.material-sphere-page {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 导航栏 */
.nav-header {
  height: 60px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.page-title {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

/* 3D 场景 */
.scene-container {
  flex: 1;
  position: relative;
  min-width: 0;
}

/* 控制面板 */
.control-panel {
  width: 320px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
  overflow-y: auto;
  z-index: 50;
}

.left-panel {
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.right-panel {
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-title {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.control-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
}

/* 材质卡片网格 */
.material-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.material-card {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.material-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.material-card.active {
  background: rgba(64, 158, 255, 0.2);
  border-color: #409EFF;
}

.material-preview {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  box-shadow:
    inset -5px -5px 10px rgba(0, 0, 0, 0.3),
    inset 5px 5px 10px rgba(255, 255, 255, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.3);
}

.material-name {
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

.material-desc {
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
  text-align: center;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-buttons .el-button {
  flex: 1;
}

/* 底部信息 */
.info-footer {
  height: 30px;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* 响应式 */
@media (max-width: 1200px) {
  .control-panel {
    width: 280px;
  }

  .material-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 992px) {
  .main-content {
    flex-direction: column;
  }

  .control-panel {
    width: 100%;
    height: 300px;
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .left-panel, .right-panel {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
}

/* Element Plus 深色主题覆盖 */
:deep(.el-slider__runway) {
  background-color: rgba(255, 255, 255, 0.2);
}

:deep(.el-slider__button) {
  border-color: #409EFF;
}

:deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2);
}

:deep(.el-input__inner) {
  color: #fff;
}

:deep(.el-divider) {
  border-color: rgba(255, 255, 255, 0.1);
  margin: 15px 0;
}

:deep(.el-switch__label) {
  color: rgba(255, 255, 255, 0.8);
}
</style>
