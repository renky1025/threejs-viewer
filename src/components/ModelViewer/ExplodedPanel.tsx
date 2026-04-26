import React, { useState } from 'react';
import './Panels.css';

interface ExplodedPanelProps {
  onChange: (factor: number) => void;
  onReset: () => void;
}

export default function ExplodedPanel({ onChange, onReset }: ExplodedPanelProps) {
  const [factor, setFactor] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setFactor(val);
    onChange(val);
  };

  const handleReset = () => {
    setFactor(0);
    onReset();
  };

  return (
    <div className="viewer-panel exploded-panel">
      <div className="panel-header">爆炸视图</div>
      <div className="panel-content">
        <div className="control-row">
          <label>爆炸系数:</label>
          <input 
            type="range" 
            min="0" max="10" step="0.1" 
            value={factor} 
            onChange={handleChange} 
          />
          <span>{factor.toFixed(1)}</span>
        </div>
        <button className="panel-btn" onClick={handleReset}>重置</button>
      </div>
    </div>
  );
}
