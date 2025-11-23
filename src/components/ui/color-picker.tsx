'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Box } from './box';
import { Button } from './button';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  colors: string[];
  onChange: (colors: string[]) => void;
  maxColors?: number;
  disabled?: boolean;
}

const PRESET_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#D946EF', // Fuchsia
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#000000', // Black
  '#FFFFFF', // White
  '#6B7280', // Gray
];

export function ColorPicker({ colors, onChange, maxColors = 10, disabled = false }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState('#3a3d13');
  const [r, setR] = useState(58);
  const [g, setG] = useState(61);
  const [b, setB] = useState(19);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const updateFromHex = (hex: string) => {
    setCustomColor(hex);
    const rgb = hexToRgb(hex);
    if (rgb) {
      setR(rgb.r);
      setG(rgb.g);
      setB(rgb.b);
    }
  };

  const updateFromRgb = (newR: number, newG: number, newB: number) => {
    setR(newR);
    setG(newG);
    setB(newB);
    setCustomColor(rgbToHex(newR, newG, newB));
  };

  const addColor = (color: string) => {
    if (colors.length >= maxColors) return;
    if (colors.includes(color)) return;
    onChange([...colors, color]);
  };

  const removeColor = (index: number) => {
    onChange(colors.filter((_, i) => i !== index));
  };

  const addCustomColor = () => {
    if (customColor && !colors.includes(customColor) && colors.length < maxColors) {
      addColor(customColor);
    }
  };

  return (
    <Box className="space-y-4">
      {/* Selected Colors */}
      {colors.length > 0 ? (
        <Box>
          <Box className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selected Colors ({colors.length}/{maxColors})
          </Box>
          <Box className="flex flex-wrap gap-1">
            {colors.map((color, index) => (
              <Box
                key={`${color}-${index}`}
                className="relative group"
              >
                <Box
                  className="w-12 h-12 rounded-sm border-2 border-gray-200 dark:border-gray-700"
                  style={{ backgroundColor: color }}
                />
                {!disabled && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity z-1"
                    onClick={() => removeColor(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      ): null}

      {/* Color Picker Section */}
      {colors.length < maxColors && !disabled && (
        <Box>
          <Box className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Add Colors
          </Box>
          <Box className="space-y-4">
            {/* Top Row: Custom Color Picker and Preset Colors */}
            <Box className="flex gap-4">
              {/* Custom Color - Left Side */}
              <Box className="shrink-0">
                <Box className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Custom Color
                </Box>
                <Box className="h-[100px]">
                  <Input
                    type="color"
                    value={customColor}
                    onChange={(e) => updateFromHex(e.target.value)}
                    className="w-25 h-full p-0 cursor-pointer overflow-hidden"
                  />
                </Box>
              </Box>

              {/* Preset Colors - Right Side in 2 Rows */}
              <Box className="flex-1">
                <Box className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Preset Colors
                </Box>
                <Box className="grid grid-cols-10 gap-1">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => addColor(color)}
                      disabled={colors.includes(color) || colors.length >= maxColors}
                      className={cn(
                        "w-full aspect-square rounded-sm transition-all hover:scale-110",
                        colors.includes(color)
                          ? "border-gray-400 opacity-50 cursor-not-allowed"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-400 cursor-pointer",
                        color === '#FFFFFF' && "border-gray-300"
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={`Add ${color}`}
                    />
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Bottom Row: HEX and RGB Inputs */}
            <Box className="flex gap-2 items-end">
              {/* HEX Input */}
              <Box className="flex-1">
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                  HEX
                </label>
                <Input
                  type="text"
                  value={customColor}
                  onChange={(e) => updateFromHex(e.target.value)}
                  placeholder="#000000"
                  className="font-mono text-sm"
                  maxLength={7}
                />
              </Box>

              {/* R Input */}
              <Box className="w-20">
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                  R
                </label>
                <Input
                  type="number"
                  value={r}
                  onChange={(e) => updateFromRgb(parseInt(e.target.value) || 0, g, b)}
                  min={0}
                  max={255}
                  className="text-sm"
                />
              </Box>

              {/* G Input */}
              <Box className="w-20">
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                  G
                </label>
                <Input
                  type="number"
                  value={g}
                  onChange={(e) => updateFromRgb(r, parseInt(e.target.value) || 0, b)}
                  min={0}
                  max={255}
                  className="text-sm"
                />
              </Box>

              {/* B Input */}
              <Box className="w-20">
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                  B
                </label>
                <Input
                  type="number"
                  value={b}
                  onChange={(e) => updateFromRgb(r, g, parseInt(e.target.value) || 0)}
                  min={0}
                  max={255}
                  className="text-sm"
                />
              </Box>

              {/* Add Button */}
              <Button
                type="button"
                onClick={addCustomColor}
                disabled={colors.includes(customColor) || colors.length >= maxColors}
                className="h-9"
              >
                <Plus className="h-6 w-6 mr-2" />
                Add Color
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {colors.length >= maxColors && (
        <Box className="text-sm text-amber-600 dark:text-amber-400">
          Maximum of {maxColors} colors reached
        </Box>
      )}
    </Box>
  );
}
