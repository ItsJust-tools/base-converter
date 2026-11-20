import type { Tool, ToolConfig, ToolExporterDefinition, DeserializeResult } from '@itsjust/core';
import toolConfig from './tool.config';
import { hexColorMixerTool, type ToolState } from './tool-definition';

export type { ToolState };
export const notepadInitialState = hexColorMixerTool.initialState;

/**
 * Legacy alias kept so @/tool/notepad-state imports keep working.
 * The notepad-era scaffold used this path for the shared state definition.
 */
export const notepadTool: Tool<ToolState> = {
  id: toolConfig.id,
  name: toolConfig.name,
  version: toolConfig.version,
  config: toolConfig as unknown as ToolConfig,
  initialState: hexColorMixerTool.initialState,
  serialize: hexColorMixerTool.serialize,
  deserialize: (data: unknown): DeserializeResult<ToolState> => hexColorMixerTool.deserialize(data),
  exporters: [
    { format: 'png', loader: () => import('./exporters/png') },
    { format: 'jpeg', loader: () => import('./exporters/jpeg') },
    { format: 'webp', loader: () => import('./exporters/webp') },
    { format: 'pdf', loader: () => import('./exporters/pdf') },
  ] as ToolExporterDefinition[],
};
