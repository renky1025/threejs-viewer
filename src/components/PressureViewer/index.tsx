import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createPressureVisualization, type PressureVisualization } from '../../utils/pressureData';
import { usePressureVisualization } from '../../composables';
import type { Model } from '../../core/types';
import './PressureViewer.style.css';

export interface PressureViewerProps {
  model: Model;
  onLoading?: (progress: number) => void;
  onLoaded?: () => void;
  onError?: (error: unknown) => void;
}

export interface PressureViewerRef {
  reset: () => void;
}

const PressureViewer = forwardRef<PressureViewerRef, PressureViewerProps>(({ model, onLoading, onLoaded, onError }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    colorMap,
    minValue,
    maxValue,
    selectedPressure,
    pressureStats,
    pressureLabels,
    colorBarGradient,
    getColorForPressure,
    formatPressureValue,
    setPressureStats,
    setSelectedPressure
  } = usePressureVisualization();

  const threeInstance = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    pressureViz: PressureVisualization;
    animationId: number;
  } | null>(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      const inst = threeInstance.current;
      if (inst) {
        inst.camera.position.set(0, 0, 10);
        inst.controls.target.set(0, 0, 0);
        inst.controls.update();
        inst.renderer.render(inst.scene, inst.camera);
      }
    }
  }));

  useEffect(() => {
    if (!containerRef.current || !model) return;

    let isDisposed = false;
    let animationId: number;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 100);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    const render = () => {
      renderer.render(scene, camera);
    };
    controls.addEventListener('change', render);

    const pointLight = new THREE.PointLight(0xffffff, 3, 0, 0);
    camera.add(pointLight);
    scene.add(camera);

    createPressureVisualization(
      scene,
      model.file,
      { colorMap, minValue, maxValue },
      {
        loading: (p) => {
          if (!isDisposed) onLoading?.(p);
        },
        loaded: () => {
          if (!isDisposed) {
            setIsLoading(false);
            onLoaded?.();
          }
        },
        error: (e) => {
          if (!isDisposed) {
            setIsLoading(false);
            onError?.(e);
          }
        }
      }
    ).then((viz) => {
      if (isDisposed) {
        viz.dispose();
        return;
      }

      scene.add(viz.legend);

      // calculate stats
      if (viz.mesh.geometry?.attributes.pressure) {
        const attr = viz.mesh.geometry.attributes.pressure;
        let min = Infinity, max = -Infinity, sum = 0;
        for (let i = 0; i < attr.count; i++) {
          const v = attr.getX(i);
          min = Math.min(min, v);
          max = Math.max(max, v);
          sum += v;
        }
        setPressureStats({ min, max, avg: sum / attr.count });
      }

      const animate = () => {
        animationId = requestAnimationFrame(animate);
        controls.update();
        render();
      };
      animate();

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const onMouseMove = (e: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(viz.mesh);

        if (intersects.length > 0 && intersects[0].face) {
          const face = intersects[0].face;
          const attr = viz.mesh.geometry.attributes.pressure;
          if (attr) {
            const p1 = attr.getX(face.a);
            const p2 = attr.getX(face.b);
            const p3 = attr.getX(face.c);
            setSelectedPressure((p1 + p2 + p3) / 3);
          }
        } else {
          setSelectedPressure(null);
        }
      };

      renderer.domElement.addEventListener('mousemove', onMouseMove);

      threeInstance.current = {
        scene, camera, renderer, controls, pressureViz: viz, animationId
      };
    }).catch(e => {
      if (!isDisposed) {
        console.error(e);
        setIsLoading(false);
        onError?.(e);
      }
    });

    const onResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      render();
    };
    window.addEventListener('resize', onResize);

    return () => {
      isDisposed = true;
      window.removeEventListener('resize', onResize);
      if (animationId) cancelAnimationFrame(animationId);

      if (threeInstance.current) {
        const inst = threeInstance.current;
        inst.pressureViz.dispose();
        inst.controls.dispose();
        inst.renderer.dispose();
        if (containerRef.current?.contains(inst.renderer.domElement)) {
          containerRef.current.removeChild(inst.renderer.domElement);
        }
      }
    };
  }, [model]);

  // Handle colorMap and range updates using separate effect
  useEffect(() => {
    if (threeInstance.current?.pressureViz) {
      const viz = threeInstance.current.pressureViz;
      viz.updateColorMap(colorMap);
      viz.updateRange(minValue, maxValue);
      threeInstance.current.renderer.render(threeInstance.current.scene, threeInstance.current.camera);
    }
  }, [colorMap, minValue, maxValue]);

  return (
    <div className="pressure-viewer">
      <div ref={containerRef} className="viewer-container" />
      
      {!isLoading && (
        <>
          <div className="pressure-control-panel">
            {/* Control Panel Simplified */}
            <h3>压力可视化控制</h3>
            <div className="stats">
              <div>最小值: {formatPressureValue(pressureStats.min)}</div>
              <div>最大值: {formatPressureValue(pressureStats.max)}</div>
              <div>平均值: {formatPressureValue(pressureStats.avg)}</div>
            </div>
            {/* Legend Simplified */}
            <div className="pressure-legend">
              <div className="color-bar" style={{ background: colorBarGradient }} />
              <div className="labels">
                {pressureLabels.map((l: any) => <span key={l.value}>{l.label}</span>)}
              </div>
              {selectedPressure !== null && (
                <div className="selected-value">
                  当前: {formatPressureValue(selectedPressure)}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
});

PressureViewer.displayName = 'PressureViewer';
export default PressureViewer;
