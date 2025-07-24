# 压力数据可视化功能

本功能允许在Three.js查看器中可视化压力数据。

## 功能特点

- 支持多种颜色映射方案（彩虹、冷暖色调、黑体辐射、灰度）
- 可调整数值范围
- 显示压力数据图例
- 交互式3D视图

## 使用方法

1. 在模型列表中选择"压力数据"模型
2. 使用控制面板调整颜色映射和数值范围
3. 使用鼠标旋转、缩放和平移视图

## 数据格式

压力数据应为Three.js BufferGeometry JSON格式，包含以下属性：

- `position`: 顶点位置数组
- `normal`: 法线数组
- `pressure`: 压力值数组（每个顶点一个值）

示例：

```json
{
  "metadata": {
    "version": 4.5,
    "type": "BufferGeometry",
    "generator": "BufferGeometry.toJSON"
  },
  "uuid": "pressure-data-uuid",
  "type": "BufferGeometry",
  "data": {
    "attributes": {
      "position": {
        "itemSize": 3,
        "type": "Float32Array",
        "array": [...]
      },
      "normal": {
        "itemSize": 3,
        "type": "Float32Array",
        "array": [...]
      },
      "pressure": {
        "itemSize": 1,
        "type": "Float32Array",
        "array": [...]
      }
    }
  }
}
```

## 技术实现

压力数据可视化使用Three.js的Lut（查找表）功能将数值映射到颜色。实现文件包括：

- `pressureData.ts`: 压力数据可视化核心功能
- `PressureViewer.vue`: 压力数据可视化组件

## 扩展功能

可以扩展以下功能：

1. 支持更多颜色映射方案
2. 添加截面视图
3. 支持动态压力数据（时间序列）
4. 添加数据统计和分析功能