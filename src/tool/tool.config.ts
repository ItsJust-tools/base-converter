import type { ToolConfig, ToolTheme } from '@itsjust/core';

const toolTheme: ToolTheme = {
  brand: 'Base Converter',
  accent: '#10b981',
};

export const toolConfig: ToolConfig = {
  id: '1795194271',
  name: 'Base Converter',
  description:
    'Convert numbers between binary, octal, decimal, hexadecimal and arbitrary bases 2-36 with live input and bit grouping.',
  version: '1.0.0',
  exportFormats: ['png', 'jpeg', 'webp', 'pdf'],
  features: {
    export: true,
    autoSave: true,
    undoRedo: true,
    sidebar: true,
    statusBar: true,
    darkMode: true,
  },
  theme: toolTheme,
};

export default toolConfig;
