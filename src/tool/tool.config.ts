const toolConfig = {
  id: "hex-color-mixer",
  name: "HEX Color Mixer",
  category: "Design",
  description: "Blend two or more HEX colors with adjustable weights and interpolation to produce smooth gradient mixes with copyable results.",
  version: "1.0.0",
  exportFormats: ["png", "jpeg", "webp", "pdf"] as (
    | "png"
    | "jpeg"
    | "webp"
    | "pdf"
  )[],
  features: {
    export: true,
    autoSave: true,
    undoRedo: true,
    sidebar: true,
    statusBar: true,
    darkMode: true,
  },
  theme: {
    brand: "HEX Color Mixer",
    icon: '🎨',
  },
};

export const templateBaseVersion = '1.1.0';
export default toolConfig;
