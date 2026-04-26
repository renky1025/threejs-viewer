import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ArrowLeft, RefreshCw, Sun, Box, Droplets } from 'lucide-react';
import { Cloth, simulate } from '../utils/clothPhysics';
import './MaterialSphere.css';

const presetMaterials = [
  { name: '标准金属', color: '#ff6b6b', metalness: 0.9, roughness: 0.2, type: 'sphere' },
  { name: '磨砂金属', color: '#4ecdc4', metalness: 0.8, roughness: 0.6, type: 'sphere' },
  { name: '镜面抛光', color: '#ffd93d', metalness: 1.0, roughness: 0.05, type: 'sphere' },
  { name: '陶瓷质感', color: '#ffffff', metalness: 0.0, roughness: 0.1, type: 'sphere' },
  { name: '青铜质感', color: '#cd7f32', metalness: 0.8, roughness: 0.3, type: 'sphere' },
  { name: '红宝石', color: '#e74c3c', metalness: 0.2, roughness: 0.05, transmission: 0.9, ior: 1.5, thickness: 2.0, type: 'sphere' }
];

const clothPresets = [
  { name: '丝绸 (Silk)', color: '#ff4d4d', metalness: 0.1, roughness: 0.2, type: 'cloth' },
  { name: '棉布 (Cotton)', color: '#f5f5dc', metalness: 0.0, roughness: 0.9, type: 'cloth' },
  { name: '牛仔布 (Denim)', color: '#3b5998', metalness: 0.0, roughness: 0.8, type: 'cloth' }
];

export default function MaterialSphere() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const [activeMaterial, setActiveMaterial] = useState(presetMaterials[0].name);
  const materialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const clothMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const clothRef = useRef<Cloth | null>(null);
  const clothMeshRef = useRef<THREE.Mesh | null>(null);
  const clothGeoRef = useRef<THREE.BufferGeometry | null>(null);
  
  // Controls state
  const [props, setProps] = useState({
    color: presetMaterials[0].color,
    metalness: presetMaterials[0].metalness,
    roughness: presetMaterials[0].roughness,
    transmission: 0,
    ior: 1.5,
    thickness: 0,
    isCloth: false
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f); // Dark elegant background

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 2, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Realistic lighting using RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;

    // Single Sphere
    const geometry = new THREE.SphereGeometry(1.2, 128, 128);
    const material = new THREE.MeshPhysicalMaterial({
      color: props.color,
      metalness: props.metalness,
      roughness: props.roughness,
      clearcoat: 0.5,
      clearcoatRoughness: 0.1,
    });
    materialRef.current = material;
    
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Cloth Simulation Setup
    const xSegs = 40;
    const ySegs = 40;
    const restDistance = 0.08;
    const cloth = new Cloth(xSegs, ySegs, restDistance);
    clothRef.current = cloth;

    const clothGeometry = new THREE.PlaneGeometry(xSegs * restDistance, ySegs * restDistance, xSegs, ySegs);
    clothGeoRef.current = clothGeometry;

    // Initial positioning to match particles
    const posAttribute = clothGeometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < cloth.particles.length; i++) {
      const p = cloth.particles[i].position;
      posAttribute.setXYZ(i, p.x, p.y, p.z);
    }
    posAttribute.needsUpdate = true;
    clothGeometry.computeVertexNormals();

    const clothMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      metalness: 0.1,
      roughness: 0.8,
      clearcoat: 0.1
    });
    clothMaterialRef.current = clothMat;

    const clothMesh = new THREE.Mesh(clothGeometry, clothMat);
    clothMesh.visible = false;
    scene.add(clothMesh);
    clothMeshRef.current = clothMesh;

    // Floor Tile sharing the same material
    const tileGeometry = new THREE.BoxGeometry(3.5, 0.1, 3.5);
    const tileMesh = new THREE.Mesh(tileGeometry, material);
    tileMesh.position.y = -1.25; // Directly below the sphere
    scene.add(tileMesh);

    // Grid to show reflections
    const grid = new THREE.GridHelper(10, 20, 0xffffff, 0xffffff);
    grid.material.opacity = 0.05;
    grid.material.transparent = true;
    grid.position.y = -1.3;
    scene.add(grid);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();

      if (clothMesh.visible) {
        simulate(cloth, clothGeometry, 1.2);
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      container.removeChild(renderer.domElement);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      clothGeometry.dispose();
      clothMat.dispose();
      pmremGenerator.dispose();
    };
  }, []); // Only run once on mount

  // Update material when props change
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.color.set(props.color);
      materialRef.current.metalness = props.metalness;
      materialRef.current.roughness = props.roughness;
      if (!props.isCloth) {
        materialRef.current.transmission = props.transmission;
        materialRef.current.ior = props.ior;
        materialRef.current.thickness = props.thickness;
      } else {
        materialRef.current.transmission = 0;
        materialRef.current.thickness = 0;
      }
      materialRef.current.needsUpdate = true;
    }

    if (props.isCloth && clothMaterialRef.current) {
      clothMaterialRef.current.color.set(props.color);
      clothMaterialRef.current.metalness = props.metalness;
      clothMaterialRef.current.roughness = props.roughness;
    }
  }, [props]);

  const applyPreset = (preset: typeof presetMaterials[0] | typeof clothPresets[0]) => {
    setActiveMaterial(preset.name);
    
    if (preset.type === 'cloth') {
      if (clothMeshRef.current && clothRef.current && clothGeoRef.current) {
        clothMeshRef.current.visible = true;
        clothRef.current.reset();
        
        // Ensure starting geometry positions are updated
        const posAttribute = clothGeoRef.current.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < clothRef.current.particles.length; i++) {
          const p = clothRef.current.particles[i].position;
          posAttribute.setXYZ(i, p.x, p.y, p.z);
        }
        posAttribute.needsUpdate = true;
        clothGeoRef.current.computeVertexNormals();
      }
      setProps({
        color: preset.color,
        metalness: preset.metalness,
        roughness: preset.roughness,
        transmission: 0,
        ior: 1.5,
        thickness: 0,
        isCloth: true
      });
    } else {
      if (clothMeshRef.current) {
        clothMeshRef.current.visible = false;
      }
      setProps({
        color: preset.color,
        metalness: preset.metalness,
        roughness: preset.roughness,
        transmission: ('transmission' in preset && preset.transmission !== undefined) ? preset.transmission : 0,
        ior: ('ior' in preset && preset.ior !== undefined) ? preset.ior : 1.5,
        thickness: ('thickness' in preset && preset.thickness !== undefined) ? preset.thickness : 0,
        isCloth: false
      });
    }
  };

  return (
    <div className="material-sphere-page">
      <div className="nav-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
          返回主页
        </button>
        <h1 className="page-title">真实材质渲染实验室</h1>
      </div>

      <div className="main-content">
        <div ref={containerRef} className="scene-container" />

        <div className="control-panel">
          <div className="panel-section">
            <h3><Box size={16} /> 材质预设</h3>
            <div className="presets-grid">
              {presetMaterials.map((preset) => (
                <button
                  key={preset.name}
                  className={`preset-btn ${activeMaterial === preset.name ? 'active' : ''}`}
                  onClick={() => applyPreset(preset)}
                >
                  <div className="color-swatch" style={{ background: preset.color }} />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <h3><Droplets size={16} /> 布匹物理模拟</h3>
            <div className="presets-grid">
              {clothPresets.map((preset) => (
                <button
                  key={preset.name}
                  className={`preset-btn ${activeMaterial === preset.name ? 'active' : ''}`}
                  onClick={() => applyPreset(preset)}
                >
                  <div className="color-swatch" style={{ background: preset.color }} />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <h3><Sun size={16} /> 材质属性</h3>
            
            <div className="control-row">
              <label>基础颜色</label>
              <input 
                type="color" 
                value={props.color}
                onChange={e => setProps({...props, color: e.target.value})}
              />
            </div>
            
            <div className="control-row">
              <label>金属度 (Metalness): {props.metalness.toFixed(2)}</label>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={props.metalness}
                onChange={e => setProps({...props, metalness: parseFloat(e.target.value)})}
              />
            </div>
            
            <div className="control-row">
              <label>粗糙度 (Roughness): {props.roughness.toFixed(2)}</label>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={props.roughness}
                onChange={e => setProps({...props, roughness: parseFloat(e.target.value)})}
              />
            </div>

            {!props.isCloth && (
              <div className="control-row">
                <label>透光率 (Transmission): {props.transmission.toFixed(2)}</label>
                <input 
                  type="range" min="0" max="1" step="0.01" 
                  value={props.transmission}
                  onChange={e => setProps({...props, transmission: parseFloat(e.target.value)})}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
