import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModelList from '../components/ModelList';
import { useModelStore } from '../store';
import { useToast } from '../composables/useToast';
import { Palette, Search, Upload } from 'lucide-react';
import type { Model } from '../utils/types';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const store = useModelStore();
  const { showToast } = useToast.getState();
  
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  
  const supportedAccept = '.glb,.gltf,.fbx,.obj,.stl,.step,.stp,.iges,.igs';
  const categoryOptions = store.categories;
  const currentYear = new Date().getFullYear();

  const onSelect = (model: Model) => {
    navigate(`/model/${encodeURIComponent(model.name)}`);
  };

  const goToMaterialSphere = () => {
    navigate('/material-sphere');
  };

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      showToast({ type: 'error', message: '文件读取失败，请重试' });
      return;
    }

    const model = store.registerUploadedFile(file);
    if (!model) {
      showToast({ type: 'warning', message: '不支持的文件格式，请上传 glb/gltf/fbx/obj/stl/step/iges' });
      return;
    }

    showToast({ type: 'success', message: `文件已导入：${file.name}` });
    onSelect(model);
    
    // reset input
    e.target.value = '';
  };

  return (
    <div className="home-container">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">3D</div>
            <h1 className="app-title">3D Viewer <span className="highlight">Pro</span></h1>
          </div>
          
          <div className="nav-actions">
            <button className="btn-primary" onClick={goToMaterialSphere}>
              <Palette size={18} />
              <span>材质工坊</span>
            </button>
          </div>
        </div>
      </header>
      
      <main className="app-main">
        <div className="hero-section">
          <h2>探索与可视化三维模型</h2>
          <p>
            支持 OBJ, FBX, GLTF, GLB, STL, STEP, IGES 格式。
            高性能渲染，支持压力数据可视化与物理材质调试。
          </p>
          
          <div className="controls-bar">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索模型..."
              />
            </div>
            
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="category-select"
            >
              <option value="">所有分类</option>
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            
            <div className="upload-wrapper">
              <label className="btn-upload">
                <Upload size={18} />
                <span>上传本地模型</span>
                <input
                  type="file"
                  accept={supportedAccept}
                  onChange={handleUploadChange}
                  className="hidden-input"
                />
              </label>
            </div>
          </div>
        </div>
      
        <div className="main-content">
          <section className="model-section">
            <ModelList search={search} category={category} onSelect={onSelect} />
          </section>
        </div>
      </main>
      
      <footer className="app-footer">
        <p>3D Model Viewer Pro &copy; {currentYear}. Built with React & Three.js.</p>
      </footer>
    </div>
  );
}
