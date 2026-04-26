import React, { useState } from 'react';
import { Layers, Scissors, Bomb, Ruler, RotateCw, RotateCcw, Move, Monitor, Maximize } from 'lucide-react';
import type { TransformMode } from '../../core/types';
import './ViewerToolbar.css';

interface ViewerToolbarProps {
  transformMode: TransformMode;
  isRotating: boolean;
  onSetMode: (mode: TransformMode) => void;
  onReset: () => void;
  onToggleRotate: () => void;
  onToggleClipping: () => void;
  onToggleExplode: () => void;
  onToggleMeasure: () => void;
  onToggleSceneGraph: () => void;
}

export default function ViewerToolbar(props: ViewerToolbarProps) {
  return (
    <div className="viewer-toolbar">
      <div className="toolbar-group">
        <button 
          title="平移模式" 
          className={`toolbar-btn ${props.transformMode === 'translate' ? 'active' : ''}`}
          onClick={() => props.onSetMode('translate')}
        >
          <Move size={18} />
        </button>
        <button 
          title="旋转模式" 
          className={`toolbar-btn ${props.transformMode === 'rotate' ? 'active' : ''}`}
          onClick={() => props.onSetMode('rotate')}
        >
          <RotateCw size={18} />
        </button>
        <button 
          title="缩放模式" 
          className={`toolbar-btn ${props.transformMode === 'scale' ? 'active' : ''}`}
          onClick={() => props.onSetMode('scale')}
        >
          <Maximize size={18} />
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button title="复位视图" className="toolbar-btn" onClick={props.onReset}>
          <Monitor size={18} />
        </button>
        <button 
          title={props.isRotating ? '暂停自动旋转' : '自动旋转'} 
          className={`toolbar-btn ${props.isRotating ? 'active' : ''}`}
          onClick={props.onToggleRotate}
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button title="剖切面" className="toolbar-btn" onClick={props.onToggleClipping}>
          <Scissors size={18} />
        </button>
        <button title="爆炸视图" className="toolbar-btn" onClick={props.onToggleExplode}>
          <Bomb size={18} />
        </button>
        <button title="测量距离" className="toolbar-btn" onClick={props.onToggleMeasure}>
          <Ruler size={18} />
        </button>
        <button title="场景层级" className="toolbar-btn" onClick={props.onToggleSceneGraph}>
          <Layers size={18} />
        </button>
      </div>
    </div>
  );
}
