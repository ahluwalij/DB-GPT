import { apiInterceptors, postChatModeParamsFileLoad, postChatModeParamsList, getAllResources } from '@/client/api';
import DBIcon from '@/components/common/db-icon';
import { ChatContentContext } from '@/pages/chat';
import { IDB } from '@/types/chat';
import { dbMapper } from '@/utils';
import { ExperimentOutlined, FolderAddOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { Select, Tooltip, Upload } from 'antd';
import { ChevronDown, Loader2, BookOpen, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import classNames from 'classnames';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import React, { memo, useCallback, useContext, useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const Resource: React.FC<{
  fileList: UploadFile[];
  setFileList: React.Dispatch<React.SetStateAction<UploadFile<any>[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  fileName: string;
  showAllResources?: boolean; // Optional prop to force showing all resources
}> = ({ fileList, setFileList, setLoading, fileName, showAllResources = false }) => {
  const { setResourceValue, setResourceType, appInfo, refreshHistory, refreshDialogList, modelValue, resourceValue, history } =
    useContext(ChatContentContext);

  const { temperatureValue, maxNewTokensValue } = useContext(ChatContentContext);
  const searchParams = useSearchParams();
  const scene = searchParams?.get('scene') ?? '';
  const chatId = searchParams?.get('id') ?? '';

  const { t } = useTranslation();
  const router = useRouter();

  // Handle resource switching
  const handleResourceSwitch = useCallback((newValue: string, newType: 'database' | 'knowledge' | null) => {
    setResourceValue(newValue);
    setResourceType(newType);
    
    // Update the URL to reflect the new resource type when switching between database and knowledge
    if (chatId && newType !== null) {
      const newScene = newType === 'database' ? 'chat_with_db_execute' : 'chat_knowledge';
      // Update URL without page reload
      const newUrl = `/chat?scene=${newScene}&id=${chatId}${modelValue ? `&model=${modelValue}` : ''}`;
      router.push(newUrl, undefined, { shallow: true });
    }
  }, [setResourceValue, setResourceType, chatId, modelValue, router]);

  // dataBase
  const [dbs, setDbs] = useState<IDB[]>([]);
  const [dbsLoading, setDbsLoading] = useState(false);
  const [allResources, setAllResources] = useState<{ databases: IDB[]; knowledge_spaces: IDB[] } | null>(null);
  const [showUnifiedView, setShowUnifiedView] = useState(false);
  
  // Track if we've initialized to prevent auto-selection after manual deselection
  const hasInitialized = useRef(false);
  // Track the previous resource type to detect changes
  const prevResourceType = useRef<string | undefined>();

  // 左边工具栏动态可用key
  const paramKey: string[] = useMemo(() => {
    return appInfo.param_need?.map(i => i.type) || [];
  }, [appInfo.param_need]);

  const isDataBase = useMemo(() => {
    return (
      paramKey.includes('resource') && appInfo.param_need?.filter(i => i.type === 'resource')[0]?.value === 'database'
    );
  }, [appInfo.param_need, paramKey]);

  const isKnowledge = useMemo(() => {
    return (
      paramKey.includes('resource') && appInfo.param_need?.filter(i => i.type === 'resource')[0]?.value === 'knowledge'
    );
  }, [appInfo.param_need, paramKey]);

  const resource = useMemo(() => appInfo.param_need?.find(i => i.type === 'resource'), [appInfo.param_need]);

  // Fetch database options
  const fetchDbs = useCallback(async () => {
    if ((isDataBase || isKnowledge) && !resource?.bind_value) {
      setDbsLoading(true);
      try {
        // Check if we should show unified view (both databases and knowledge spaces)
        if (showUnifiedView) {
          const [, res] = await apiInterceptors(getAllResources());
          if (res) {
            setAllResources(res);
            // Combine both resources into a single list
            const combined = [
              ...(res.databases || []),
              ...(res.knowledge_spaces || [])
            ];
            setDbs(combined);
          }
        } else {
          const [, res] = await apiInterceptors(postChatModeParamsList(scene as string));
          setDbs(res ?? []);
        }
      } catch (error) {
        console.error('Failed to fetch database list:', error);
        setDbs([]);
      } finally {
        setDbsLoading(false);
      }
    }
  }, [isDataBase, isKnowledge, resource?.bind_value, scene, showUnifiedView]);

  // Effect to fetch databases when needed
  useEffect(() => {
    fetchDbs();
  }, [fetchDbs]);

  // Always show unified view for database and knowledge resources
  useEffect(() => {
    // Enable unified view when we have database or knowledge resources
    const shouldShowUnified = isDataBase || isKnowledge;
    setShowUnifiedView(shouldShowUnified);
  }, [isDataBase, isKnowledge]);

  // Reset initialization when resource type changes
  useEffect(() => {
    const currentResourceType = resource?.value;
    if (prevResourceType.current && prevResourceType.current !== currentResourceType) {
      // Resource type has changed, reset initialization
      hasInitialized.current = false;
      // Clear existing databases to force reload
      setDbs([]);
    }
    prevResourceType.current = currentResourceType;
  }, [resource?.value]);

  const dbOpts = useMemo(
    () =>
      dbs.map?.((db: IDB) => {
        return {
          label: (
            <>
              <DBIcon
                width={22}
                height={22}
                src={dbMapper[db.type].icon}
                label={dbMapper[db.type].label}
                className='mr-1 w-[2rem] h-[2rem]'
              />
              {db.param}
            </>
          ),
          value: db.param,
        };
      }),
    [dbs],
  );

  // Set default resource value when dbOpts are available (only on initial load)
  useEffect(() => {
    if (!resourceValue && dbOpts?.length > 0 && !hasInitialized.current && allResources) {
      setResourceValue(dbOpts[0].value);
      // Determine if the first option is a database or knowledge space
      const firstDb = allResources.databases.find(db => db.param === dbOpts[0].value);
      if (firstDb) {
        setResourceType('database');
      } else {
        setResourceType('knowledge');
      }
      hasInitialized.current = true;
    }
  }, [resourceValue, dbOpts, setResourceValue, setResourceType, allResources]);

  // 上传
  const onUpload = useCallback(async () => {
    const formData = new FormData();
    formData.append('doc_files', fileList?.[0] as any);
    setLoading(true);
    const [_, res] = await apiInterceptors(
      postChatModeParamsFileLoad({
        convUid: chatId,
        chatMode: scene,
        data: formData,
        model: modelValue,
        temperatureValue,
        maxNewTokensValue,
        config: {
          timeout: 1000 * 60 * 60,
        },
      }),
    ).finally(() => {
      setLoading(false);
    });
    if (res) {
      setResourceValue(res);
      await refreshHistory();
      await refreshDialogList();
    }
  }, [chatId, fileList, modelValue, refreshDialogList, refreshHistory, scene, setLoading, setResourceValue]);

  if (!paramKey.includes('resource')) {
    return (
      <Tooltip title={t('extend_tip')}>
        <div className='flex w-8 h-8 items-center justify-center rounded-md hover:bg-[rgb(221,221,221,0.6)]'>
          <ExperimentOutlined className='text-lg cursor-not-allowed opacity-30' />
        </div>
      </Tooltip>
    );
  }

  switch (resource?.value) {
    case 'excel_file':
    case 'text_file':
    case 'image_file':
    case 'audio_file':
    case 'video_file': {
      // Dynamically set accept attribute based on resource type
      const getAcceptTypes = () => {
        switch (resource?.value) {
          case 'excel_file':
            return '.csv,.xlsx,.xls';
          case 'text_file':
            return '.txt,.doc,.docx,.pdf,.md';
          case 'image_file':
            return '.jpg,.jpeg,.png,.gif,.bmp,.webp';
          case 'audio_file':
            return '.mp3,.wav,.ogg,.aac';
          case 'video_file':
            return '.mp4,.wav,.wav';
          default:
            return '';
        }
      };
      // Only disable file upload when scene is "chat_excel", otherwise allow modification
      const isDisabled = scene === 'chat_excel' ? !!fileName || !!fileList[0]?.name : false;
      const title = scene === 'chat_excel' ? t('file_tip') : t('file_upload_tip');

      return (
        <Upload
          name='file'
          accept={getAcceptTypes()}
          fileList={fileList}
          showUploadList={false}
          beforeUpload={(_, fileList) => {
            setFileList?.(fileList);
          }}
          customRequest={onUpload}
          disabled={isDisabled}
        >
          <Tooltip title={title} arrow={false} placement='bottom'>
            <div className='flex w-8 h-8 items-center justify-center rounded-md hover:bg-[rgb(221,221,221,0.6)]'>
              <FolderAddOutlined className={classNames('text-xl', { 'cursor-pointer': !isDisabled })} />
            </div>
          </Tooltip>
        </Upload>
      );
    }
    case 'database':
    case 'knowledge':
    case 'plugin':
    case 'awel_flow': {
      // Extract the label text from the React element if needed
      const selectedOption = dbOpts.find(opt => opt.value === resourceValue);
      let selectedLabel = "None";
      
      if (selectedOption) {
        // If label is a React element, try to extract text
        if (React.isValidElement(selectedOption.label)) {
          // For knowledge spaces, the label is usually just text
          selectedLabel = resourceValue || "None";
        } else {
          selectedLabel = selectedOption.label || resourceValue || "None";
        }
      } else if (resourceValue) {
        selectedLabel = resourceValue;
      }
      
      // Get the appropriate icon based on resource type
      const getResourceIcon = () => {
        if (resource?.value === 'knowledge') {
          return <BookOpen className="h-4 w-4 text-gray-600 flex-shrink-0" />;
        }
        return <Database className="h-4 w-4 text-gray-600 flex-shrink-0" />;
      };
      
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="w-44 justify-between bg-gray-100 hover:bg-gray-200 font-medium transition-all duration-200 rounded-full px-3 py-1 text-sm"
              disabled={!!resource?.bind_value}
            >
              <div className="flex items-center gap-2 min-w-0">
                {resourceValue ? (
                  <>
                    {getResourceIcon()}
                    <span className="truncate text-sm text-gray-700">{selectedLabel}</span>
                  </>
                ) : (
                  <>
                    <div className="h-4 w-4 flex items-center justify-center flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                    </div>
                    <span className="truncate text-sm text-gray-700">None</span>
                  </>
                )}
              </div>
              {dbsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-80 p-0 bg-white border border-gray-200 shadow-lg rounded-lg"
            align="start"
            style={{ backgroundColor: 'white !important' }}
          >
            <div className="bg-white rounded-lg" style={{ backgroundColor: 'white !important' }}>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="font-medium text-gray-800">
                  {showUnifiedView ? 'All Resources' : resource?.value === 'knowledge' ? 'Knowledge Spaces' : 'Select Resource'}
                </h3>
              </div>

              {/* Selection Section */}
              <div className="max-h-64 overflow-y-auto">
                {dbsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {/* None option */}
                    <div 
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer font-medium transition-all duration-200 ${
                        !resourceValue 
                          ? 'bg-gray-50 text-gray-700 border border-gray-200 shadow-sm' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      onClick={() => {
                        handleResourceSwitch('', null);
                      }}
                    >
                      <div className="h-5 w-5 border-2 border-gray-300 rounded flex items-center justify-center">
                        {!resourceValue && <div className="h-2 w-2 bg-gray-600 rounded-full"></div>}
                      </div>
                      <span className="text-sm">None</span>
                    </div>

                    {/* Show categorized resources if in unified view */}
                    {showUnifiedView && allResources ? (
                      <>
                        {/* Databases Section */}
                        {allResources.databases.length > 0 && (
                          <>
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Databases
                            </div>
                            {allResources.databases.map(db => {
                              const isSelected = resourceValue === db.param;
                              return (
                                <div 
                                  key={db.param}
                                  className={`flex items-center gap-3 p-2 mx-3 rounded-lg cursor-pointer font-medium transition-all duration-200 ${
                                    isSelected 
                                      ? 'bg-gray-50 text-gray-700 border border-gray-200 shadow-sm' 
                                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                  }`}
                                  onClick={() => {
                                    handleResourceSwitch(db.param, 'database');
                                  }}
                                >
                                  <div className="h-5 w-5 border-2 border-gray-300 rounded flex items-center justify-center">
                                    {isSelected && <div className="h-2 w-2 bg-gray-600 rounded-full"></div>}
                                  </div>
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <Database className="h-4 w-4 text-gray-600 flex-shrink-0" />
                                    <span className="text-sm truncate">{db.param}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        )}

                        {/* Knowledge Spaces Section */}
                        {allResources.knowledge_spaces.length > 0 && (
                          <>
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
                              Knowledge Spaces
                            </div>
                            {allResources.knowledge_spaces.map(space => {
                              const isSelected = resourceValue === space.param;
                              return (
                                <div 
                                  key={space.param}
                                  className={`flex items-center gap-3 p-2 mx-3 rounded-lg cursor-pointer font-medium transition-all duration-200 ${
                                    isSelected 
                                      ? 'bg-gray-50 text-gray-700 border border-gray-200 shadow-sm' 
                                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                  }`}
                                  onClick={() => {
                                    handleResourceSwitch(space.param, 'knowledge');
                                  }}
                                >
                                  <div className="h-5 w-5 border-2 border-gray-300 rounded flex items-center justify-center">
                                    {isSelected && <div className="h-2 w-2 bg-gray-600 rounded-full"></div>}
                                  </div>
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <BookOpen className="h-4 w-4 text-gray-600 flex-shrink-0" />
                                    <span className="text-sm truncate">{space.param}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        )}
                      </>
                    ) : (
                      /* Original single list display */
                      dbOpts.map(option => (
                        <div 
                          key={option.value}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer font-medium transition-all duration-200 ${
                            resourceValue === option.value 
                              ? 'bg-gray-50 text-gray-700 border border-gray-200 shadow-sm' 
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                          onClick={() => {
                            // Determine type based on appInfo
                            let type: 'database' | 'knowledge' | null = null;
                            if (resource?.value === 'database') {
                              type = 'database';
                            } else if (resource?.value === 'knowledge') {
                              type = 'knowledge';
                            }
                            handleResourceSwitch(option.value, type);
                          }}
                        >
                          <div className="h-5 w-5 border-2 border-gray-300 rounded flex items-center justify-center">
                            {resourceValue === option.value && <div className="h-2 w-2 bg-gray-600 rounded-full"></div>}
                          </div>
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {React.isValidElement(option.label) ? (
                              <>
                                {getResourceIcon()}
                                <span className="text-sm truncate">{option.value}</span>
                              </>
                            ) : (
                              <span className="text-sm truncate">{option.label}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}

                    {/* Show empty state if no options available */}
                    {((showUnifiedView && allResources && allResources.databases.length === 0 && allResources.knowledge_spaces.length === 0) || 
                      (!showUnifiedView && dbOpts.length === 0)) && (
                      <div className="p-8 text-center">
                        <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500">
                          {showUnifiedView ? 'No resources available' : 
                           resource?.value === 'knowledge' ? 'No knowledge spaces available' : 
                           'No databases available'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      );
    }
  }
};

export default memo(Resource);
