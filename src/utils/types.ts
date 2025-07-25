/**
 * 定义项目中使用的类型
 */

// 模型数据类型
export interface Model {
  name: string;
  type: 'gltf' | 'glb' | 'obj' | 'fbx' | 'json' | 'stl';
  file: string;
  category: string;
  thumbnail?: string;
}

// 地面类型
export type GroundType = 'material' | 'floor' | 'grass';

// 变换模式类型
export type TransformMode = 'translate' | 'rotate' | 'scale';

// Three.js 实例接口
export interface ThreeInstance {
  resetView: () => void;
  addCubeControl: (dom: HTMLDivElement) => void;
  initCubeControl: () => void;
  setTransformMode: (mode: TransformMode) => void;
  dispose: () => void;
  updateTransform: (position: number[], rotation: number[], scale: number) => void;
  startAutoRotate: () => void;
  stopAutoRotate: () => void;
}