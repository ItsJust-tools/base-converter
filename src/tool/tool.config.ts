import type { ToolConfig } from '@itsjust/core';

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
  theme: {
    accent: '#10b981',
    accentHover: '#059669',
    accentSubtle: 'rgba(16, 185, 129, 0.08)',
    brand: 'Base Converter',
    icon: '\u{1F416}',
  },
};

export default toolConfig;
