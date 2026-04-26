import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useModelStore } from '../store';
import ModelViewer from '../components/ModelViewer';
import PressureViewer from '../components/PressureViewer';
import LoadingBar from '../components/LoadingBar';
import { buildRemoteModelFromQuery } from '../utils/remoteModel';
import { useToast, getErrorMessage } from '../composables/useToast';
import { ArrowLeft } from 'lucide-react';
import type { GroundType, Model } from '../utils/types';
import './ModelPage.css';

export default function ModelPage() {
  const { name } = useParams<{ name: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const store = useModelStore();
  const { showToast } = useToast.getState();

  const queryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const obj: Record<string, any> = {};
    for (const [key, value] of params) {
      obj[key] = value;
    }
    return obj;
  }, [location.search]);

  const remoteModel = useMemo(() => buildRemoteModelFromQuery(queryParams), [queryParams]);

  const model = useMemo<Model | undefined>(() => {
    if (remoteModel) return remoteModel;
    return store.findByName(name || '');
  }, [remoteModel, name, store]);

  const modelDisplayName = useMemo(() => {
    const modelName = model?.name || '';
    return modelName.split('__uploaded_')[0] || modelName;
  }, [model]);

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);
  const [errorTitle, setErrorTitle] = useState('模型加载失败');
  const [errorDescription, setErrorDescription] = useState('无法加载请求的模型，请检查模型文件是否存在或格式是否正确。');
  
  const ground: GroundType = 'material';
  const viewerRef = useRef<any>(null);

  const setPageError = (title: string, description: string) => {
    setLoading(false);
    setError(true);
    setErrorTitle(title);
    setErrorDescription(description);
  };

  const handleLoading = (val: number) => {
    setLoading(true);
    setProgress(val);
  };

  const handleLoaded = () => {
    setLoading(false);
    setError(false);
    if (model) {
      showToast({ type: 'success', message: `模型加载完成：${modelDisplayName}` });
    }
  };

  const handleError = (reason?: unknown) => {
    setPageError('模型加载失败', '无法加载请求的模型，请检查模型文件是否存在或格式是否正确。');
    showToast({
      type: 'error',
      message: getErrorMessage(reason, '模型加载失败，请检查文件是否可用')
    });
  };

  const goBack = () => {
    navigate('/');
  };

  useEffect(() => {
    if (model || remoteModel) return;

    const isUploadedModel = (name || '').includes('__uploaded_');
    if (isUploadedModel) {
      setPageError('上传模型已失效', '本地上传文件在页面刷新后无法直接恢复，请返回首页重新上传。');
      showToast({ type: 'warning', message: '上传模型在刷新后失效，请重新上传文件' });
      return;
    }

    setPageError('未找到模型', '请求的模型不存在，可能已被移除，请返回首页重新选择。');
    showToast({ type: 'error', message: '未找到模型，请返回首页重新选择' });
  }, [model, remoteModel, name, showToast]);

  return (
    <div className="model-page-container">
      <div className="back-button">
        <button className="btn-circle-primary" onClick={goBack}>
          <ArrowLeft size={20} />
        </button>
      </div>
      
      {loading && <LoadingBar progress={progress} />}
      
      {error && (
        <div className="error-alert">
          <div className="alert-content">
            <h3>{errorTitle}</h3>
            <p>{errorDescription}</p>
          </div>
        </div>
      )}
      
      {!error && model && (
        model.type === 'json' ? (
          <PressureViewer
            ref={viewerRef}
            model={model}
            onLoading={handleLoading}
            onLoaded={handleLoaded}
            onError={handleError}
          />
        ) : (
          <ModelViewer
            ref={viewerRef}
            model={model}
            ground={ground}
            onLoading={handleLoading}
            onLoaded={handleLoaded}
            onError={handleError}
          />
        )
      )}
      
      {model && !loading && !error && (
        <div className="model-name">
          {modelDisplayName} <span className="type-badge">{model.type.toUpperCase()}</span>
        </div>
      )}
    </div>
  );
}
