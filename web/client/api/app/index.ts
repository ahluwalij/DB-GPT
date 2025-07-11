import {
  AppListResponse,
  CreateAppParams,
  IAgent,
  IApp,
  NativeAppScenesResponse,
  StrategyResponse,
  TeamMode,
} from '@/types/app';

import { ConfigurableParams } from '@/types/common';

import { GET, POST } from '../index';

/**
 * Get team mode list
 */
export const getTeamMode = () => {
  return GET<null, TeamMode[]>('/api/v1/team-mode/list');
};
/**
 * Create application
 */
export const addApp = (data: CreateAppParams) => {
  return POST<CreateAppParams, IApp>('/api/v1/app/create', data);
};
/**
 * Update application
 */
export const updateApp = (data: CreateAppParams) => {
  return POST<CreateAppParams, IApp>('/api/v1/app/edit', data);
};
/**
 * Get application list
 */
export const getAppList = (data: Record<string, any>) => {
  return POST<Record<string, any>, AppListResponse>(
    `/api/v1/app/list?page=${data.page || 1}&page_size=${data.page_size || 12}`,
    data,
  );
};
/**
 * Get agents for creating applications
 */
export const getAgents = () => {
  return GET<object, IAgent[]>('/api/v1/agents/list', {});
};
/**
 * Create auto_plan application
 * Get model strategy
 */
export const getAppStrategy = () => {
  return GET<null, StrategyResponse[]>(`/api/v1/llm-strategy/list`);
};
/**
 * Create native_app application
 * Get resource parameters
 */
export const getResource = (data: Record<string, string>) => {
  return GET<Record<string, string>, Record<string, any>[]>(`/api/v1/app/resources/list?type=${data.type}`);
};

export const getResourceV2 = (data: Record<string, string>) => {
  return GET<Record<string, string>, ConfigurableParams[]>(`/api/v1/app/resources/list?type=${data.type}&version=v2`);
};

/**
 * Create native_app application
 * Get application types
 */
export const getNativeAppScenes = () => {
  return GET<null, NativeAppScenesResponse[]>('/api/v1/native_scenes');
};
/**
 * Create native_app application
 * Get model list
 */
export const getAppStrategyValues = (type: string) => {
  return GET<string, string[]>(`/api/v1/llm-strategy/value/list?type=${type}`);
};

/**
 * Query application permissions
 */
export const getAppAdmins = (appCode: string) => {
  return GET<null, string[]>(`/api/v1/app/${appCode}/admins`);
};
/**
 * Update application permissions
 */
export const updateAppAdmins = (data: { app_code: string; admins: string[] }) => {
  return POST<{ app_code: string; admins: string[] }, null>(`/api/v1/app/admins/update`, data);
};
