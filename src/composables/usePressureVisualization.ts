import { useState, useMemo } from 'react';
import type { ColorMapType, PressureStats } from '../core/types';

export interface UsePressureVisualizationOptions {
  initialColorMap?: ColorMapType;
  initialMinValue?: number;
  initialMaxValue?: number;
}

export function usePressureVisualization(options: UsePressureVisualizationOptions = {}) {
  const {
    initialColorMap = 'rainbow',
    initialMinValue = 0,
    initialMaxValue = 2000
  } = options;

  const [colorMap, setColorMap] = useState<ColorMapType>(initialColorMap);
  const [minValue, setMinValue] = useState(initialMinValue);
  const [maxValue, setMaxValue] = useState(initialMaxValue);
  const [selectedPressure, setSelectedPressure] = useState<number | null>(null);
  const [pressureStats, setPressureStats] = useState<PressureStats | null>(null);

  const pressureLabels = useMemo(() => {
    const range = maxValue - minValue;
    const labels: { value: number; label: string }[] = [];
    const labelCount = 8;

    for (let i = 0; i <= labelCount; i++) {
      const value = minValue + (i / labelCount) * range;
      labels.push({ value, label: formatPressureValue(value) });
    }
    return labels;
  }, [minValue, maxValue]);

  function getRainbowColor(t: number): string {
    const hue = (1 - t) * 240;
    return `hsl(${hue}, 100%, 50%)`;
  }

  function getCoolToWarmColor(t: number): string {
    const r = Math.floor(t * 255);
    const g = Math.floor(128 * (1 - Math.abs(2 * t - 1)));
    const b = Math.floor((1 - t) * 255);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function getBlackbodyColor(t: number): string {
    let r: number, g: number, b: number;
    if (t < 0.25) { r = 0; g = 0; b = Math.floor(t * 4 * 255); }
    else if (t < 0.5) { r = 0; g = Math.floor((t - 0.25) * 4 * 255); b = 255; }
    else if (t < 0.75) { r = Math.floor((t - 0.5) * 4 * 255); g = 255; b = Math.floor((0.75 - t) * 4 * 255); }
    else { r = 255; g = Math.floor((1 - t) * 4 * 255); b = 0; }
    return `rgb(${r}, ${g}, ${b})`;
  }

  function getGrayscaleColor(t: number): string {
    const gray = Math.floor(t * 255);
    return `rgb(${gray}, ${gray}, ${gray})`;
  }

  function getColorForPressure(pressure: number): string {
    const normalized = (pressure - minValue) / (maxValue - minValue);
    const clamped = Math.max(0, Math.min(1, normalized));

    switch (colorMap) {
      case 'rainbow': return getRainbowColor(clamped);
      case 'cooltowarm': return getCoolToWarmColor(clamped);
      case 'blackbody': return getBlackbodyColor(clamped);
      case 'grayscale': return getGrayscaleColor(clamped);
      default: return getRainbowColor(clamped);
    }
  }

  const colorBarGradient = useMemo(() => {
    const colors: string[] = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const value = minValue + (i / steps) * (maxValue - minValue);
      const color = getColorForPressure(value);
      colors.push(`${color} ${(i / steps) * 100}%`);
    }
    return `linear-gradient(to right, ${colors.join(', ')})`;
  }, [minValue, maxValue, colorMap]);

  function formatPressureValue(value: number | undefined): string {
    if (value === undefined || value === null) return '0';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toFixed(0);
  }

  function setRange(min: number, max: number) {
    setMinValue(min);
    setMaxValue(max);
  }

  return {
    colorMap,
    minValue,
    maxValue,
    selectedPressure,
    pressureStats: pressureStats || { min: 0, max: 0, avg: 0 },
    pressureLabels,
    colorBarGradient,
    getColorForPressure,
    formatPressureValue,
    setPressureStats,
    setSelectedPressure,
    setColorMap,
    setRange
  };
}
