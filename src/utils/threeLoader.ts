import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import { createOrbitControls, createCubeControl } from './controls'
import { createGround } from './ground'
import { setupLighting } from './lighting'
import { createRealisticSky } from './skybox'

import type { Model, GroundType, ThreeInstance, TransformMode } from './types'

/**
 * 加载3D模型
 * @param container 容器DOM元素
 * @param model 模型信息
 * @param ground 地面类型
 * @param callbacks 回调函数对象
 * @returns Three.js实例接口
 */
export async function loadModel(
  container: HTMLDivElement,
  model: Model,
  ground: GroundType,
  callbacks: {
    loading: (progress: number) => void;
    loaded: () => void;
    error: (error: any) => void;
  }
): Promise<ThreeInstance> {
  // 自动旋转相关变量和函数，必须放在顶部
  let autoRotate = false
  let autoRotateAngle = 0
  const autoRotateSpeed = 0.01
  let autoRotateRadius = 0
  let group: THREE.Group | null = null
  function startAutoRotate() {
    autoRotate = true
    autoRotateRadius = 0 // 下次animate时用当前相机参数初始化
  }
  function stopAutoRotate() {
    autoRotate = false
  }

  // 场景、相机、渲染器
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000)
  camera.position.set(0, 2, 5)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap // 软阴影
  renderer.outputColorSpace = THREE.SRGBColorSpace // 正确的颜色空间

  container.innerHTML = ''
  container.appendChild(renderer.domElement)

  // 添加天空盒
  createRealisticSky(scene)

  // 添加地面
  const groundMesh = createGround(scene, ground)

  // 设置灯光
  setupLighting(scene)

  // 加载模型
  let object: THREE.Object3D | null = null
  let mixer: THREE.AnimationMixer | null = null
  const clock = new THREE.Clock()

  // 创建立方体（用于联动）
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)

  // 创建带有标签的材质
  const createLabeledFace = (color: number, label: string): THREE.MeshBasicMaterial => {
    // 创建画布
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const context = canvas.getContext('2d')
    if (!context) return new THREE.MeshBasicMaterial({ color })

    // 填充背景色
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`
    context.fillRect(0, 0, 128, 128)

    // 添加文字
    context.font = 'bold 40px Arial'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillStyle = '#ffffff'
    context.fillText(label, 64, 64)

    // 创建纹理
    const texture = new THREE.CanvasTexture(canvas)

    // 返回材质
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9
    })
  }

  // 创建六个面的材质
  const cubeMaterials = [
    createLabeledFace(0xff0000, '右'), // 右
    createLabeledFace(0x00ff00, '左'), // 左
    createLabeledFace(0x0000ff, '上'), // 上
    createLabeledFace(0x000000, '下'), // 下
    createLabeledFace(0xff00ff, '前'), // 前
    createLabeledFace(0x00ffff, '后')  // 后
  ]

  // 立方体不添加到主场景中，只用于右下角控制器

  // 变换控制器
  let transformControls: TransformControls | null = null

  try {
    callbacks.loading(10)

    if (model.type === 'gltf' || model.type === 'glb') {
      const loader = new GLTFLoader()
      const gltf = await loader.loadAsync(model.file, (xhr) => {
        if (xhr.lengthComputable) {
          const progress = Math.floor((xhr.loaded / xhr.total) * 70) + 10
          callbacks.loading(progress)
        }
      })
      object = gltf.scene

      // 处理动画
      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(object)
        const clip = gltf.animations[0]
        if (clip) {
          const action = mixer.clipAction(clip)
          action.play()
        }
      }
    } else if (model.type === 'fbx') {
      const loader = new FBXLoader()
      object = await loader.loadAsync(model.file, (xhr) => {
        if (xhr.lengthComputable) {
          const progress = Math.floor((xhr.loaded / xhr.total) * 70) + 10
          callbacks.loading(progress)
        }
      })

      // 处理动画
      if (object.animations && object.animations.length > 0) {
        mixer = new THREE.AnimationMixer(object)
        const clip = object.animations[0]
        if (clip) {
          const action = mixer.clipAction(clip)
          action.play()
        }
      }
    } else if (model.type === 'json') {
      // 处理压力数据JSON文件 - 暂时跳过，由PressureViewer组件处理
      console.log('JSON文件应由PressureViewer组件处理')
      throw new Error('JSON文件类型应使用专门的压力数据查看器')
    } else if (model.type === 'obj') {
      // 检查是否有对应的MTL文件
      const mtlPath = model.file.replace('.obj', '.mtl')
      console.log('加载OBJ模型:', model.file)
      console.log('检查MTL文件:', mtlPath)

      // 检查MTL文件是否存在的函数
      const checkMTLExists = async (url: string): Promise<boolean> => {
        try {
          const response = await fetch(url, { method: 'HEAD' })
          return response.ok
        } catch (error) {
          return false
        }
      }

      const mtlExists = await checkMTLExists(mtlPath)
      console.log('MTL文件存在:', mtlExists)

      if (mtlExists) {
        try {
          // MTL文件存在，尝试加载
          console.log('开始加载MTL文件...')
          const mtlLoader = new MTLLoader()
          const materials = await mtlLoader.loadAsync(mtlPath, (xhr) => {
            if (xhr.lengthComputable) {
              const progress = Math.floor((xhr.loaded / xhr.total) * 30) + 10
              callbacks.loading(progress)
            }
          })

          console.log('MTL文件加载完成，开始预处理材质...')

          // 确保材质完全预加载完成
          await new Promise<void>((resolve) => {
            // 预加载材质
            materials.preload()

            // 等待一小段时间确保材质处理完成
            setTimeout(() => {
              console.log('材质预处理完成')
              resolve()
            }, 100)
          })

          console.log('开始加载OBJ文件...')
          // 使用材质加载OBJ
          const loader = new OBJLoader()
          loader.setMaterials(materials)
          object = await loader.loadAsync(model.file, (xhr) => {
            if (xhr.lengthComputable) {
              const progress = Math.floor((xhr.loaded / xhr.total) * 40) + 40
              callbacks.loading(progress)
            }
          })

          console.log('OBJ和MTL加载成功，验证材质应用...')

          // 验证材质是否正确应用
          let materialApplied = false
          object.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh
              if (mesh.material && mesh.material !== undefined) {
                materialApplied = true
              }
            }
          })

          if (!materialApplied) {
            console.warn('材质未正确应用，使用默认材质')
            throw new Error('材质应用失败')
          }

          console.log('材质验证成功')
        } catch (error) {
          console.warn('MTL加载失败，使用默认材质:', error)
          // MTL加载失败，只加载OBJ
          const loader = new OBJLoader()
          object = await loader.loadAsync(model.file, (xhr) => {
            if (xhr.lengthComputable) {
              const progress = Math.floor((xhr.loaded / xhr.total) * 70) + 10
              callbacks.loading(progress)
            }
          })

          // 应用默认材质
          object.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh
              mesh.material = new THREE.MeshStandardMaterial({
                color: 0xcccccc,
                roughness: 0.7,
                metalness: 0.2,
                side: THREE.DoubleSide
              })
            }
          })
        }
      } else {
        // MTL文件不存在，只加载OBJ
        console.log('MTL文件不存在，只加载OBJ文件')
        const loader = new OBJLoader()
        object = await loader.loadAsync(model.file, (xhr) => {
          if (xhr.lengthComputable) {
            const progress = Math.floor((xhr.loaded / xhr.total) * 70) + 10
            callbacks.loading(progress)
          }
        })

        // 应用默认材质到所有网格
        object.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.material = new THREE.MeshStandardMaterial({
              color: 0xcccccc,
              roughness: 0.7,
              metalness: 0.2,
              side: THREE.DoubleSide
            })
          }
        })
      }
    } else if (model.type === 'stl') {
      // 加载STL模型
      const loader = new STLLoader()
      const geometry = await loader.loadAsync(model.file, (xhr) => {
        if (xhr.lengthComputable) {
          const progress = Math.floor((xhr.loaded / xhr.total) * 70) + 10
          callbacks.loading(progress)
        }
      })
      // 判断是否有颜色
      let material: THREE.Material
      if ((geometry as any).hasColors) {
        material = new THREE.MeshPhongMaterial({
          opacity: (geometry as any).alpha,
          vertexColors: true
        })
      } else {
        material = new THREE.MeshPhongMaterial({
          color: 0xd5d5d5,
          specular: 0x494949,
          shininess: 200
        })
      }
      object = new THREE.Mesh(geometry, material)
      object.castShadow = true
      object.receiveShadow = true
    } else {
      throw new Error('不支持的模型类型')
    }

    if (!object) {
      throw new Error('模型加载失败')
    }

    callbacks.loading(80)

    // 加载完成后，包裹到group
    group = new THREE.Group()
    if (object) {
      // 计算包围盒中心
      const box = new THREE.Box3().setFromObject(object)
      const center = box.getCenter(new THREE.Vector3())
      object.position.sub(center) // 让object居中于group原点
      group.add(object)
      if (group) scene.add(group)
    }

    // 设置阴影
    object.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    // 自动调整模型大小 - 先缩放object
    const box0 = new THREE.Box3().setFromObject(object)
    const size0 = box0.getSize(new THREE.Vector3())
    const maxDim = Math.max(size0.x, size0.y, size0.z)
    const targetSize = 3
    if (maxDim < targetSize) {
      const scale = targetSize / maxDim
      object.scale.set(scale, scale, scale)
    } else if (maxDim > 10) {
      const scale = 10 / maxDim
      object.scale.set(scale, scale, scale)
    }
    // 只做包围盒底部贴地
    const box = new THREE.Box3().setFromObject(object)
    object.position.y -= box.min.y
    
    // 模型已准备好，可以初始化立方体控制器

    scene.add(object)
    callbacks.loading(100)
    callbacks.loaded()
    // 加载完成后自动旋转（延后，确保controls已初始化）
    setTimeout(() => { startAutoRotate() }, 0)
  } catch (error) {
    console.error('模型加载失败:', error)
    callbacks.error(error)
    throw error
  }

  // 创建控制器
  const controls = createOrbitControls(camera, renderer)
  // 防止极点穿透
  controls.minPolarAngle = 0.01
  controls.maxPolarAngle = Math.PI - 0.01

  // 处理窗口大小变化
  const handleResize = () => {
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
  }

  window.addEventListener('resize', handleResize)

  // 动画循环
  let animationId: number
  function animate() {
    animationId = requestAnimationFrame(animate)
    // 自动公转：相机围绕controls.target旋转，半径固定
    if (autoRotate && controls) {
      if (autoRotateRadius === 0) {
        autoRotateRadius = camera.position.distanceTo(controls.target)
        autoRotateAngle = Math.atan2(camera.position.z - controls.target.z, camera.position.x - controls.target.x)
      }
      autoRotateAngle += autoRotateSpeed
      camera.position.x = Math.cos(autoRotateAngle) * autoRotateRadius + controls.target.x
      camera.position.z = Math.sin(autoRotateAngle) * autoRotateRadius + controls.target.z
      camera.lookAt(controls.target)
    }
    controls.update()
    if (mixer) {
      const delta = clock.getDelta()
      mixer.update(delta)
    }
    renderer.render(scene, camera)
  }
  animate()

  // 复位视图
  function resetView() {
    camera.position.set(0, 2, 5)
    controls.target.set(0, 1, 0)
    controls.update()
  }

  // 创建变换控制器
  function createModelTransformControls(mode: TransformMode = 'translate') {
    if (!object || !camera) {
      console.warn('无法创建变换控制器: 对象或相机不存在');
      return null;
    }

      // 如果已经存在控制器，先清理
      if (transformControls) {
        try {
          // 尝试从场景中移除
          transformControls.detach();
          transformControls.dispose();
        } catch (e) {
          console.warn('清理旧控制器失败:', e);
        }
      }

      // 创建新的控制器
      console.log('创建新的TransformControls');
      const newTransformControls = new TransformControls(camera, renderer.domElement);

      // 尝试附加对象
      try {
        newTransformControls.attach(object);
      } catch (e) {
        console.error('无法附加对象到控制器:', e);
        newTransformControls.dispose();
        return null;
      }
      if (transformControls) {
        transformControls.setMode(mode);
        transformControls.setSize(0.7);

        // 当使用变换控制器时，暂时禁用轨道控制器，避免冲突
        transformControls.addEventListener('dragging-changed', (event) => {
          controls.enabled = !event.value;
        });
      }

      // 不要直接添加TransformControls到场景中
      // 而是使用其内部的对象
      try {
        // 检查transformControls是否有效
        if (!transformControls) {
          console.warn('TransformControls创建失败');
          return null;
        }

        // 不需要手动添加到场景，TransformControls会自己处理
        // scene.add(transformControls as any); // 这行代码会导致错误

        return transformControls;
      } catch (error) {
        console.warn('TransformControls处理失败:', error);
        if (transformControls) {
          transformControls.dispose();
        }
        return null;
      }
  }
  // 设置变换模式
  function setTransformMode(mode: TransformMode) {
      try {
        if (transformControls) {
          console.log('设置变换模式:', mode);
          transformControls.setMode(mode);
        } else {
          console.log('创建变换控制器，模式:', mode);
          // 创建新的控制器
          const newControls = createModelTransformControls(mode);
          if (newControls) {
            transformControls = newControls;
          } else {
            console.warn('无法创建变换控制器');
          }
        }
      } catch (error) {
        console.error('设置变换模式失败:', error);
      }
    }

    // 立方体控制器
    let cleanupCubeControl: (() => void) | null = null;

    // 立方体控制器相关变量
    let cubeContainer: HTMLDivElement | null = null;
    let cubeRenderer: THREE.WebGLRenderer | null = null;
    let cubeAnimationId: number | null = null;

    // 创建右下角的立方体控制器
    function initCubeControl() {
      if (!object) return;

      // 创建立方体控制器
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
      cube.scale.set(1, 1, 1); // 放大立方体以便在更大的容器中更清楚地显示

      // 创建一个单独的场景和相机来渲染立方体
      const cubeScene = new THREE.Scene();
      const cubeCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 10);
      cubeCamera.position.set(2, 1.5, 3); // 稍微倾斜的角度，可以看到立方体的多个面
      cubeCamera.lookAt(0, 0, 0);

      // 添加环境光以便更好地看到立方体
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      cubeScene.add(ambientLight);

      // 添加方向光以增强立体感
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(1, 1, 1);
      cubeScene.add(directionalLight);

      // 将立方体添加到新场景
      cubeScene.add(cube);

      // 创建一个新的渲染器，完全透明背景
      cubeRenderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      });
      cubeRenderer.setSize(240, 240); // 画大一倍
      cubeRenderer.setClearColor(0x000000, 0); // 完全透明背景

      // 创建一个DOM元素来容纳立方体渲染器
      cubeContainer = document.createElement('div');
      cubeContainer.style.position = 'absolute';
      cubeContainer.style.bottom = '20px';
      cubeContainer.style.right = '20px';
      cubeContainer.style.width = '240px'; // 画大一倍
      cubeContainer.style.height = '240px'; // 画大一倍
      cubeContainer.style.zIndex = '100';
      cubeContainer.style.cursor = 'grab';
      cubeContainer.style.userSelect = 'none';
      cubeContainer.title = '拖拽旋转立方体，Shift+拖拽旋转场景，点击面切换视角';

      // 将渲染器添加到容器
      cubeContainer.appendChild(cubeRenderer.domElement);

      // 将容器添加到主容器
      container.appendChild(cubeContainer);

      // 定义视角预设
      const viewPresets = {
        front: { position: [0, 0, 5], target: [0, 0, 0] },
        back: { position: [0, 0, -5], target: [0, 0, 0] },
        left: { position: [-5, 0, 0], target: [0, 0, 0] },
        right: { position: [5, 0, 0], target: [0, 0, 0] },
        top: { position: [0, 5, 0], target: [0, 0, 0] },
        bottom: { position: [0, -5, 0], target: [0, 0, 0] }
      };

      // 添加鼠标事件处理
      let isMouseDown = false;
      let mouseX = 0;
      let mouseY = 0;
      let hasDragged = false;

      cubeContainer.addEventListener('mousedown', (event) => {
        isMouseDown = true;
        hasDragged = false;
        mouseX = event.clientX;
        mouseY = event.clientY;
        cubeContainer!.style.cursor = 'grabbing';
        event.preventDefault();
      });

      cubeContainer.addEventListener('mousemove', (event) => {
        if (!isMouseDown) return;

        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;

        // 如果移动距离超过阈值，认为是拖拽
        if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
          hasDragged = true;

          // 检查是否按住了Shift键来区分操作模式
          if (event.shiftKey) {
            // Shift + 拖拽：旋转主相机
            const rotationSpeed = 0.005;

            const spherical = new THREE.Spherical();
            const offset = camera.position.clone().sub(controls.target);
            spherical.setFromVector3(offset);

            spherical.theta -= deltaX * rotationSpeed;
            spherical.phi += deltaY * rotationSpeed;

            // 限制垂直角度
            spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

            offset.setFromSpherical(spherical);
            camera.position.copy(controls.target).add(offset);

            controls.update();
          } else {
            // 普通拖拽：旋转立方体本身
            const rotationSpeed = 0.01;

            // 暂停自动动画
            isAnimatingCube = false;

            // 直接修改立方体旋转
            cubeBaseRotation.y += deltaX * rotationSpeed;
            cubeBaseRotation.x += deltaY * rotationSpeed;

            // 更新目标旋转以匹配当前旋转
            targetBaseRotation.x = cubeBaseRotation.x;
            targetBaseRotation.y = cubeBaseRotation.y;
            targetBaseRotation.z = cubeBaseRotation.z;
          }
        }

        mouseX = event.clientX;
        mouseY = event.clientY;
      });

      cubeContainer.addEventListener('mouseup', () => {
        isMouseDown = false;
        // 延迟重置拖拽状态，避免立即触发点击事件
        setTimeout(() => {
          hasDragged = false;
        }, 100);
      });

      // 添加点击事件来切换到预设视角
      cubeContainer.addEventListener('click', (event) => {
        // 防止拖拽时触发点击
        if (hasDragged) return;

        const rect = cubeContainer!.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // 使用射线检测来确定点击的是立方体的哪个面
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(x, y);

        raycaster.setFromCamera(mouse, cubeCamera);
        const intersects = raycaster.intersectObject(cube);

        if (intersects.length > 0) {
          const faceIndex = intersects[0].face?.materialIndex;
          let targetView = 'front';

          // 根据材质索引确定面
          switch (faceIndex) {
            case 0: targetView = 'right'; break;  // 右面
            case 1: targetView = 'left'; break;   // 左面
            case 2: targetView = 'top'; break;    // 上面
            case 3: targetView = 'bottom'; break; // 下面
            case 4: targetView = 'front'; break;  // 前面
            case 5: targetView = 'back'; break;   // 后面
            default: targetView = 'front'; break;
          }

          // 平滑切换到目标视角，同时旋转立方体
          const preset = viewPresets[targetView as keyof typeof viewPresets];
          if (preset) {
            // 计算立方体应该旋转到的角度
            let newCubeRotationX = 0, newCubeRotationY = 0, newCubeRotationZ = 0;

            switch (targetView) {
              case 'front':
                newCubeRotationX = 0; newCubeRotationY = 0; newCubeRotationZ = 0;
                break;
              case 'back':
                newCubeRotationX = 0; newCubeRotationY = Math.PI; newCubeRotationZ = 0;
                break;
              case 'right':
                newCubeRotationX = 0; newCubeRotationY = -Math.PI / 2; newCubeRotationZ = 0;
                break;
              case 'left':
                newCubeRotationX = 0; newCubeRotationY = Math.PI / 2; newCubeRotationZ = 0;
                break;
              case 'top':
                newCubeRotationX = Math.PI / 2; newCubeRotationY = 0; newCubeRotationZ = 0;
                break;
              case 'bottom':
                newCubeRotationX = -Math.PI / 2; newCubeRotationY = 0; newCubeRotationZ = 0;
                break;
            }

            // 开始立方体旋转动画
            isAnimatingCube = true;
            cubeAnimationProgress = 0;
            cubeAnimationStartTime = Date.now();
            cubeAnimationDuration = 600; // 点击切换时动画稍快一些

            targetBaseRotation.x = newCubeRotationX;
            targetBaseRotation.y = newCubeRotationY;
            targetBaseRotation.z = newCubeRotationZ;

            // 同时切换相机视角
            animateCamera(preset.position, preset.target);
          }
        }
      });

      // 相机动画函数
      function animateCamera(targetPosition: number[], targetLookAt: number[]) {
        const startPosition = camera.position.clone();
        const startTarget = controls.target.clone();

        const endPosition = new THREE.Vector3(targetPosition[0], targetPosition[1], targetPosition[2]);
        const endTarget = new THREE.Vector3(targetLookAt[0], targetLookAt[1], targetLookAt[2]);

        let progress = 0;
        const duration = 1000; // 1秒动画
        const startTime = Date.now();

        function animateCameraStep() {
          const elapsed = Date.now() - startTime;
          progress = Math.min(elapsed / duration, 1);

          // 使用缓动函数
          const easeProgress = 1 - Math.pow(1 - progress, 3);

          // 插值位置
          camera.position.lerpVectors(startPosition, endPosition, easeProgress);
          controls.target.lerpVectors(startTarget, endTarget, easeProgress);

          controls.update();

          if (progress < 1) {
            requestAnimationFrame(animateCameraStep);
          }
        }

        animateCameraStep();
      }

      // 立方体的基础旋转（用户可以通过拖拽修改）
      let cubeBaseRotation = { x: 0, y: 0, z: 0 };
      let targetBaseRotation = { x: 0, y: 0, z: 0 };
      let isAnimatingCube = false;
      let cubeAnimationProgress = 0;
      let cubeAnimationDuration = 800; // 动画持续时间（毫秒）
      let cubeAnimationStartTime = 0;

      // 计算角度的最短路径差值
      function getShortestAngleDiff(from: number, to: number): number {
        let diff = to - from;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        return diff;
      }

      // 立方体动画更新
      function updateCube() {
        if (!cubeRenderer) return;

        // 跟随主场景group旋转
        if (group) {
          cube.quaternion.copy(group.quaternion)
        }

        // 计算当前相机的方向，确定哪个面应该激活
        const cameraPosition = camera.position.clone();
        const targetPosition = controls.target.clone();

        // 计算从目标到相机的方向向量
        const direction = cameraPosition.sub(targetPosition).normalize();

        // 根据相机方向确定主要的激活面，并计算基础旋转
        let newBaseRotationX = 0, newBaseRotationY = 0, newBaseRotationZ = 0;

        const absX = Math.abs(direction.x);
        const absY = Math.abs(direction.y);
        const absZ = Math.abs(direction.z);

        if (absX > absY && absX > absZ) {
          // 左右面激活
          if (direction.x > 0) {
            newBaseRotationY = -Math.PI / 2; // 右面
          } else {
            newBaseRotationY = Math.PI / 2;  // 左面
          }
        } else if (absY > absX && absY > absZ) {
          // 上下面激活
          if (direction.y > 0) {
            newBaseRotationX = Math.PI / 2; // 上面 - 修正：相机在上方时显示上面
          } else {
            newBaseRotationX = -Math.PI / 2;  // 下面 - 修正：相机在下方时显示下面
          }
        } else {
          // 前后面激活
          if (direction.z > 0) {
            newBaseRotationY = 0; // 前面
          } else {
            newBaseRotationY = Math.PI; // 后面
          }
        }

        // 检查是否需要开始新的动画
        if (!isAnimatingCube &&
          (Math.abs(targetBaseRotation.x - newBaseRotationX) > 0.1 ||
            Math.abs(targetBaseRotation.y - newBaseRotationY) > 0.1 ||
            Math.abs(targetBaseRotation.z - newBaseRotationZ) > 0.1)) {

          // 开始新的动画
          isAnimatingCube = true;
          cubeAnimationProgress = 0;
          cubeAnimationStartTime = Date.now();

          // 设置新的目标旋转
          targetBaseRotation.x = newBaseRotationX;
          targetBaseRotation.y = newBaseRotationY;
          targetBaseRotation.z = newBaseRotationZ;
        }

        // 处理立方体旋转动画
        if (isAnimatingCube) {
          const elapsed = Date.now() - cubeAnimationStartTime;
          cubeAnimationProgress = Math.min(elapsed / cubeAnimationDuration, 1);

          // 使用缓动函数
          const easeProgress = 1 - Math.pow(1 - cubeAnimationProgress, 3);

          // 使用最短路径插值旋转
          const diffX = getShortestAngleDiff(cubeBaseRotation.x, targetBaseRotation.x);
          const diffY = getShortestAngleDiff(cubeBaseRotation.y, targetBaseRotation.y);
          const diffZ = getShortestAngleDiff(cubeBaseRotation.z, targetBaseRotation.z);

          const currentBaseRotation = {
            x: cubeBaseRotation.x + diffX * easeProgress,
            y: cubeBaseRotation.y + diffY * easeProgress,
            z: cubeBaseRotation.z + diffZ * easeProgress
          };

          // 应用当前旋转
          cube.rotation.set(currentBaseRotation.x, currentBaseRotation.y, currentBaseRotation.z);

          // 检查动画是否完成
          if (cubeAnimationProgress >= 1) {
            isAnimatingCube = false;
            cubeBaseRotation.x = targetBaseRotation.x;
            cubeBaseRotation.y = targetBaseRotation.y;
            cubeBaseRotation.z = targetBaseRotation.z;
          }
        } else {
          // 没有动画时，直接应用旋转
          cube.rotation.set(cubeBaseRotation.x, cubeBaseRotation.y, cubeBaseRotation.z);
        }

        // 渲染立方体
        cubeRenderer.render(cubeScene, cubeCamera);

        cubeAnimationId = requestAnimationFrame(updateCube);
      }

      // 开始立方体动画
      updateCube();
    }

    // 添加外部立方体控制器（小窗口）
    function addCubeControl(dom: HTMLDivElement) {
      if (!dom || !object) return;

      // 清理之前的控制器
      if (cleanupCubeControl) {
        cleanupCubeControl();
      }

      // 创建新的控制器，并同步旋转
      cleanupCubeControl = createCubeControl(dom, (rotation) => {
        if (object) {
          object.rotation.x = rotation.x;
          object.rotation.y = rotation.y;
          object.rotation.z = rotation.z;
        }
      });
    }

    // 更新变换
    function updateTransform(position: number[], rotation: number[], scale: number) {
      if (!group) return;
      // 位置
      if (position && position.length === 3) {
        const x = position[0] !== undefined ? position[0] : group.position.x;
        const y = position[1] !== undefined ? position[1] : group.position.y;
        const z = position[2] !== undefined ? position[2] : group.position.z;
        group.position.set(x, y, z);
      }
      // 旋转
      if (rotation && rotation.length === 3) {
        const x = rotation[0] !== undefined ? rotation[0] : group.rotation.x;
        const y = rotation[1] !== undefined ? rotation[1] : group.rotation.y;
        const z = rotation[2] !== undefined ? rotation[2] : group.rotation.z;
        group.rotation.set(x, y, z);
      }
      // 缩放
      if (scale !== undefined) {
        group.scale.set(scale, scale, scale);
      }
    }

    // 销毁资源
    function dispose() {
      // 停止主动画循环
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      // 停止立方体动画
      if (typeof cubeAnimationId !== 'undefined' && cubeAnimationId) {
        cancelAnimationFrame(cubeAnimationId)
      }
      // 移除立方体容器
      if (cubeContainer && container.contains(cubeContainer)) {
        container.removeChild(cubeContainer)
      }
      // 清理立方体渲染器
      if (cubeRenderer) {
        cubeRenderer.dispose()
      }
      // 移除事件监听器
      window.removeEventListener('resize', handleResize)
      // 清理立方体控制器
      if (cleanupCubeControl) {
        cleanupCubeControl()
      }
      // 清理变换控制器
      if (transformControls) {
        try {
          scene.remove(transformControls as any)
          transformControls.dispose()
          transformControls = null
        } catch (error) {
          console.warn('TransformControls清理失败:', error)
        }
      }
      // 清理场景所有Mesh的资源
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose()
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose())
            } else {
              object.material.dispose()
            }
          }
        }
      })
      // 清理渲染器
      renderer.dispose()
      // 清理控制器
      controls.dispose()
      // 移除group
      if (group && scene.children.includes(group)) {
        scene.remove(group)
      }
      // 断开所有引用
      group = null
      object = null
      mixer = null
      cubeContainer = null
      cubeRenderer = null
      cleanupCubeControl = null
    }

    return {
      resetView,
      addCubeControl,
      initCubeControl,
      setTransformMode,
      dispose,
      updateTransform,
      startAutoRotate,
      stopAutoRotate
    }
  } 