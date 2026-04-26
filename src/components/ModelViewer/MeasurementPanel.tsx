import React from 'react';
import type { MeasureResult } from '../../core/types';
import './Panels.css';

interface MeasurementPanelProps {
  result: MeasureResult | null;
  onClear: () => void;
}

export default function MeasurementPanel({ result, onClear }: MeasurementPanelProps) {
  return (
    <div className="viewer-panel measurement-panel">
      <div className="panel-header">测量结果</div>
      <div className="panel-content">
        {!result ? (
          <div className="empty-text">点击模型上的两点进行测量</div>
        ) : (
          <div className="measure-result">
            <div className="measure-item">
              <span className="label">距离:</span>
              <span className="value">{result.distance ? result.distance.toFixed(4) : '0'} mm</span>
            </div>
            {result.points && result.points[0] && (
              <div className="measure-item">
                <span className="label">点1:</span>
                <span className="value">
                  ({result.points[0][0].toFixed(2)}, {result.points[0][1].toFixed(2)}, {result.points[0][2].toFixed(2)})
                </span>
              </div>
            )}
            {result.points && result.points[1] && (
              <div className="measure-item">
                <span className="label">点2:</span>
                <span className="value">
                  ({result.points[1][0].toFixed(2)}, {result.points[1][1].toFixed(2)}, {result.points[1][2].toFixed(2)})
                </span>
              </div>
            )}
            <button className="panel-btn" onClick={onClear}>清除测量</button>
          </div>
        )}
      </div>
    </div>
  );
}
