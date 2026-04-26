import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { loadModel } from '../../utils/threeLoader';
import type { Model, GroundType, ThreeInstance, TransformMode, ClippingAxis, SceneNode, MeasureResult } from '../../core/types';
import ViewerToolbar from './ViewerToolbar';
import ClippingPanel from './ClippingPanel';
import ExplodedPanel from './ExplodedPanel';
import SceneGraphPanel from './SceneGraphPanel';
import MeasurementPanel from './MeasurementPanel';

export interface ModelViewerProps {
  model: Model;
  ground: GroundType;
  onLoading?: (progress: number) => void;
  onLoaded?: () => void;
  onError?: (error: unknown) => void;
}

export interface ModelViewerRef {
  reset: () => void;
  addCubeControl: (dom: HTMLDivElement) => void;
  updateTransform: () => void;
}

const ModelViewer = forwardRef<ModelViewerRef, ModelViewerProps>(({ model, ground, onLoading, onLoaded, onError }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const threeInstanceRef = useRef<ThreeInstance | null>(null);
  const initTokenRef = useRef(0);

  // States
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');
  const [isRotating, setIsRotating] = useState(true);
  const [showClippingPanel, setShowClippingPanel] = useState(false);
  const [showExplodePanel, setShowExplodePanel] = useState(false);
  const [showSceneGraphPanel, setShowSceneGraphPanel] = useState(false);
  const [sceneNodes, setSceneNodes] = useState<SceneNode[]>([]);
  const [showMeasurePanel, setShowMeasurePanel] = useState(false);
  const [measureResult, setMeasureResult] = useState<MeasureResult | null>(null);

  // Position, Rotation, Scale (for generic transform logic if needed)
  const [transform, setTransform] = useState({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1 });

  useImperativeHandle(ref, () => ({
    reset: () => {
      setTransform({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1 });
      threeInstanceRef.current?.resetView?.();
    },
    addCubeControl: (dom: HTMLDivElement) => {
      threeInstanceRef.current?.addCubeControl?.(dom);
    },
    updateTransform: () => {
      threeInstanceRef.current?.updateTransform?.(
        [transform.x, transform.y, transform.z],
        [transform.rx, transform.ry, transform.rz],
        transform.s
      );
    }
  }));

  useEffect(() => {
    if (!containerRef.current || !model) return;
    
    initTokenRef.current += 1;
    const token = initTokenRef.current;
    
    setLoading(true);
    onLoading?.(0);

    if (threeInstanceRef.current) {
      threeInstanceRef.current.dispose();
      threeInstanceRef.current = null;
    }

    setTransform({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1 });
    setShowClippingPanel(false);
    setShowExplodePanel(false);
    setShowSceneGraphPanel(false);
    setShowMeasurePanel(false);
    setSceneNodes([]);
    setMeasureResult(null);

    loadModel(containerRef.current, model, ground, {
      loading: (progress) => {
        if (token !== initTokenRef.current) return;
        onLoading?.(progress);
      },
      loaded: () => {
        if (token !== initTokenRef.current) return;
        setLoading(false);
        onLoaded?.();
        setTimeout(() => {
          if (token !== initTokenRef.current) return;
          threeInstanceRef.current?.initCubeControl?.();
        }, 100);
      },
      error: (error) => {
        if (token !== initTokenRef.current) return;
        console.error('模型加载失败:', error);
        setLoading(false);
        onError?.(error);
      }
    }).then((instance) => {
      if (token !== initTokenRef.current) {
        instance.dispose();
        return;
      }
      threeInstanceRef.current = instance;
      instance.setTransformMode?.(transformMode);
      if (instance.getSceneGraph) {
        setSceneNodes(instance.getSceneGraph() || []);
      }
      if (instance.getMeasureResult) {
        setMeasureResult(instance.getMeasureResult());
      }
      
      instance.startAutoRotate?.();
      setIsRotating(true);
    }).catch((e) => {
      if (token !== initTokenRef.current) return;
      console.error('模型加载异常:', e);
      setLoading(false);
      onError?.(e);
    });

    return () => {
      initTokenRef.current += 1;
      if (threeInstanceRef.current) {
        threeInstanceRef.current.dispose();
        threeInstanceRef.current = null;
      }
    };
  }, [model, ground]);

  const handleSetMode = (mode: TransformMode) => {
    setTransformMode(mode);
    threeInstanceRef.current?.setTransformMode?.(mode);
  };

  const handleToggleRotate = () => {
    if (!threeInstanceRef.current) return;
    if (isRotating) {
      threeInstanceRef.current.stopAutoRotate?.();
      setIsRotating(false);
    } else {
      threeInstanceRef.current.startAutoRotate?.();
      setIsRotating(true);
    }
  };

  const handleClippingChange = (axis: ClippingAxis, enabled: boolean, value: number) => {
    if (!threeInstanceRef.current) return;
    threeInstanceRef.current.toggleClippingAxis?.(axis, enabled);
    if (enabled) {
      threeInstanceRef.current.setClippingPlane?.(axis, value);
    }
  };

  const handleClippingReset = () => {
    threeInstanceRef.current?.resetClipping?.();
  };

  const handleExplodeChange = (factor: number) => {
    threeInstanceRef.current?.setExplodeFactor?.(factor);
  };

  const handleExplodeReset = () => {
    threeInstanceRef.current?.resetExplode?.();
  };

  const refreshMeasureResult = () => {
    if (threeInstanceRef.current?.getMeasureResult) {
      setMeasureResult(threeInstanceRef.current.getMeasureResult());
    } else {
      setMeasureResult(null);
    }
  };

  const handleToggleMeasure = () => {
    setShowMeasurePanel(prev => {
      const next = !prev;
      if (next) {
        threeInstanceRef.current?.enableMeasure?.();
        refreshMeasureResult();
      } else {
        threeInstanceRef.current?.disableMeasure?.();
      }
      return next;
    });
  };

  const handleMeasureClear = () => {
    threeInstanceRef.current?.clearMeasure?.();
    refreshMeasureResult();
  };

  const handleViewerClick = () => {
    if (showMeasurePanel) {
      refreshMeasureResult();
    }
  };

  const handleToggleSceneGraph = () => {
    setShowSceneGraphPanel(prev => {
      const next = !prev;
      if (next && threeInstanceRef.current?.getSceneGraph) {
        setSceneNodes(threeInstanceRef.current.getSceneGraph() || []);
      }
      return next;
    });
  };

  const handleNodeVisible = (id: string, visible: boolean) => {
    threeInstanceRef.current?.applyNodeVisibility?.(id, visible);
  };

  const handleNodeOpacity = (id: string, opacity: number) => {
    threeInstanceRef.current?.applyNodeOpacity?.(id, opacity);
  };

  const handleNodeLock = (id: string, locked: boolean) => {
    threeInstanceRef.current?.applyNodeLock?.(id, locked);
  };

  return (
    <div className="model-viewer" onClick={handleViewerClick} style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
      
      {!loading && (
        <>
          <ViewerToolbar
            transformMode={transformMode}
            isRotating={isRotating}
            onSetMode={handleSetMode}
            onReset={() => threeInstanceRef.current?.resetView?.()}
            onToggleRotate={handleToggleRotate}
            onToggleClipping={() => setShowClippingPanel(!showClippingPanel)}
            onToggleExplode={() => setShowExplodePanel(!showExplodePanel)}
            onToggleMeasure={handleToggleMeasure}
            onToggleSceneGraph={handleToggleSceneGraph}
          />
          
          {showClippingPanel && (
            <ClippingPanel onChange={handleClippingChange} onReset={handleClippingReset} />
          )}

          {showExplodePanel && (
            <ExplodedPanel onChange={handleExplodeChange} onReset={handleExplodeReset} />
          )}

          {showMeasurePanel && (
            <MeasurementPanel result={measureResult} onClear={handleMeasureClear} />
          )}

          {showSceneGraphPanel && (
            <SceneGraphPanel 
              nodes={sceneNodes} 
              onToggleVisible={handleNodeVisible}
              onChangeOpacity={handleNodeOpacity}
              onToggleLock={handleNodeLock}
            />
          )}
        </>
      )}
    </div>
  );
});

ModelViewer.displayName = 'ModelViewer';

export default ModelViewer;
