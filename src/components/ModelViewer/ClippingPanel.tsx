import React, { useState } from 'react';
import type { ClippingAxis } from '../../core/types';
import './Panels.css';

interface ClippingPanelProps {
  onChange: (axis: ClippingAxis, enabled: boolean, value: number) => void;
  onReset: () => void;
}

export default function ClippingPanel({ onChange, onReset }: ClippingPanelProps) {
  const [axes, setAxes] = useState({
    x: { enabled: false, value: 0.5 },
    y: { enabled: false, value: 0.5 },
    z: { enabled: false, value: 0.5 },
  });

  const handleToggle = (axis: 'x'|'y'|'z', enabled: boolean) => {
    const newValue = axes[axis].value;
    setAxes(prev => ({ ...prev, [axis]: { ...prev[axis], enabled } }));
    onChange(axis, enabled, newValue);
  };

  const handleSlider = (axis: 'x'|'y'|'z', value: number) => {
    setAxes(prev => ({ ...prev, [axis]: { ...prev[axis], value } }));
    onChange(axis, axes[axis].enabled, value);
  };

  const handleReset = () => {
    setAxes({
      x: { enabled: false, value: 0.5 },
      y: { enabled: false, value: 0.5 },
      z: { enabled: false, value: 0.5 },
    });
    onReset();
  };

  return (
    <div className="viewer-panel clipping-panel">
      <div className="panel-header">剖切面控制</div>
      <div className="panel-content">
        {(['x', 'y', 'z'] as const).map((axis) => (
          <div key={axis} className="control-row">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={axes[axis].enabled}
                onChange={(e) => handleToggle(axis, e.target.checked)}
              />
              {axis.toUpperCase()}
            </label>
            <input 
              type="range"
              min="0" max="1" step="0.01"
              value={axes[axis].value}
              disabled={!axes[axis].enabled}
              onChange={(e) => handleSlider(axis, parseFloat(e.target.value))}
            />
          </div>
        ))}
        <button className="panel-btn" onClick={handleReset}>重置</button>
      </div>
    </div>
  );
}
