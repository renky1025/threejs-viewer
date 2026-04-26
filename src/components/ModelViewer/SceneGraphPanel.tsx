import React from 'react';
import type { SceneNode } from '../../core/types';
import './Panels.css';

interface SceneGraphPanelProps {
  nodes: SceneNode[];
  onToggleVisible: (id: string, visible: boolean) => void;
  onChangeOpacity: (id: string, opacity: number) => void;
  onToggleLock: (id: string, locked: boolean) => void;
}

const TreeNode = ({ 
  node, 
  props 
}: { 
  node: SceneNode; 
  props: SceneGraphPanelProps 
}) => {
  return (
    <div className="tree-node">
      <div className="node-row">
        <span className="node-name" title={node.name}>{node.name}</span>
        <div className="node-controls">
          <input 
            type="checkbox" 
            title="显示/隐藏"
            checked={node.visible !== false}
            onChange={(e) => props.onToggleVisible(node.id, e.target.checked)}
          />
          <input 
            type="checkbox" 
            title="锁定/解锁"
            checked={!!node.locked}
            onChange={(e) => props.onToggleLock(node.id, e.target.checked)}
          />
          <input 
            type="range"
            title="透明度"
            min="0" max="1" step="0.05"
            className="opacity-slider"
            value={node.opacity ?? 1}
            onChange={(e) => props.onChangeOpacity(node.id, parseFloat(e.target.value))}
          />
        </div>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="node-children">
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} props={props} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function SceneGraphPanel(props: SceneGraphPanelProps) {
  return (
    <div className="viewer-panel scenegraph-panel">
      <div className="panel-header">层级管理</div>
      <div className="panel-content tree-container">
        {props.nodes.length === 0 ? (
          <div className="empty-text">无节点</div>
        ) : (
          props.nodes.map(node => <TreeNode key={node.id} node={node} props={props} />)
        )}
      </div>
    </div>
  );
}
