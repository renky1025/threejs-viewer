import React, { useMemo } from 'react';
import { useModelStore } from '../store';
import type { Model } from '../utils/types';
import './ModelList.css';

const categoryLabelMap: Record<string, string> = {
  helmet: '头盔',
  character: '人物',
  furniture: '家具',
  car: '汽车',
  data: '数据',
  '压力数据': '压力数据',
  '零件': '零件',
  '机器': '机器',
  '灯': '灯',
  home: '家居',
  remote: '远程模型',
  uploaded: '本地上传'
};

interface ModelListProps {
  search: string;
  category: string;
  onSelect: (model: Model) => void;
}

export default function ModelList({ search, category, onSelect }: ModelListProps) {
  const models = useModelStore((state) => state.models);

  const filteredModels = useMemo(() => {
    return models.filter((m) =>
      (!category || m.category === category) &&
      (!search || m.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [models, search, category]);

  const getTagClass = (type: string) => {
    switch (type) {
      case 'gltf':
      case 'glb':
        return 'tag-success';
      case 'fbx':
        return 'tag-warning';
      case 'obj':
        return 'tag-info';
      case 'stl':
        return 'tag-primary';
      case 'step':
      case 'iges':
        return 'tag-danger';
      default:
        return 'tag-info';
    }
  };

  const getCategoryTagClass = (cat: string) => {
    switch (cat) {
      case 'helmet': return 'tag-danger';
      case 'character': return 'tag-warning';
      case 'furniture': return 'tag-info';
      case 'data': return 'tag-primary';
      case 'uploaded': return 'tag-success';
      case 'remote': return 'tag-warning';
      case 'home': return 'tag-primary';
      default: return 'tag-info';
    }
  };

  const getCategoryName = (cat: string) => categoryLabelMap[cat] || cat;

  const formatModelName = (name: string) => {
    const [displayName] = name.split('__uploaded_');
    return displayName || name;
  };

  if (filteredModels.length === 0) {
    return <div className="empty-state">没有找到匹配的模型</div>;
  }

  return (
    <div className="model-grid">
      {filteredModels.map((model) => (
        <div key={model.name} className="model-card" onClick={() => onSelect(model)}>
          <div className="model-thumbnail">
            <div
              className="model-thumbnail-image"
              style={{ backgroundImage: `url(${model.thumbnail || '/assets/placeholder.svg'})` }}
            />
          </div>
          <div className="model-info">
            <h3>{formatModelName(model.name)}</h3>
            <div className="tags">
              <span className={`tag ${getTagClass(model.type)}`}>{model.type}</span>
              <span className={`tag ${getCategoryTagClass(model.category)}`}>
                {getCategoryName(model.category)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
