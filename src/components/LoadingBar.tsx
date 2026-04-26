import React from 'react';
import './LoadingBar.css';

interface LoadingBarProps {
  progress: number;
}

export default function LoadingBar({ progress }: LoadingBarProps) {
  let loadingMessage = '初始化场景';
  if (progress >= 20 && progress < 50) loadingMessage = '下载模型';
  else if (progress >= 50 && progress < 80) loadingMessage = '处理模型';
  else if (progress >= 80 && progress < 100) loadingMessage = '应用材质';
  else if (progress >= 100) loadingMessage = '完成';

  return (
    <div className="loading-bar">
      <div className="loading-info">
        <span className="loading-text">{loadingMessage}</span>
        <span className="loading-percent">{progress}%</span>
      </div>
      <div className="progress-track">
        <div 
          className={`progress-fill ${progress >= 100 ? 'complete' : ''}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
