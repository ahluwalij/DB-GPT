import { apiInterceptors, clearChatHistory } from '@/client/api';
import { ChatContentContext } from '@/pages/chat';
import { ClearOutlined, LoadingOutlined, PauseCircleOutlined, RedoOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { Spin, Tooltip } from 'antd';
import classNames from 'classnames';
import Image from 'next/image';
import React, { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { parseResourceValue, transformFileUrl } from '@/utils';

import Resource from './Resource';

interface ToolsConfig {
  icon: React.ReactNode;
  can_use: boolean;
  key: string;
  tip?: string;
  onClick?: () => void;
}

const ToolsBar: React.FC<{
  ctrl: AbortController;
}> = ({ ctrl }) => {
  const { t } = useTranslation();

  const {
    history,
    scrollRef,
    canAbort,
    replyLoading,
    currentDialogue,
    appInfo,
    resourceValue,
    refreshHistory,
    setCanAbort,
    setReplyLoading,
    handleChat,
  } = useContext(ChatContentContext);

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [clsLoading, setClsLoading] = useState<boolean>(false);

  // 左边工具栏动态可用key
  const paramKey: string[] = useMemo(() => {
    return appInfo.param_need?.map(i => i.type) || [];
  }, [appInfo.param_need]);

  const rightToolsConfig: ToolsConfig[] = useMemo(() => {
    return [
      {
        tip: t('stop_replying'),
        icon: <PauseCircleOutlined className={classNames({ 'text-[#6B7280]': canAbort })} />,
        can_use: canAbort,
        key: 'abort',
        onClick: () => {
          if (!canAbort) {
            return;
          }
          ctrl.abort();
          setTimeout(() => {
            setCanAbort(false);
            setReplyLoading(false);
          }, 100);
        },
      },
      {
        tip: t('answer_again'),
        icon: <RedoOutlined />,
        can_use: !replyLoading && history.length > 0,
        key: 'redo',
        onClick: async () => {
          const lastHuman = history.filter(i => i.role === 'human')?.slice(-1)?.[0];
          handleChat(lastHuman?.context || '', {
            app_code: appInfo.app_code,
            ...(paramKey.includes('temperature') && { temperature: 0 }),
            ...(paramKey.includes('max_new_tokens') && { max_new_tokens: 4000 }),
            ...(paramKey.includes('resource') && {
              select_param:
                typeof resourceValue === 'string'
                  ? resourceValue
                  : JSON.stringify(resourceValue) || currentDialogue.select_param,
            }),
          });
          setTimeout(() => {
            scrollRef.current?.scrollTo({
              top: scrollRef.current?.scrollHeight,
              behavior: 'smooth',
            });
          }, 0);
        },
      },
    ];
  }, [
    t,
    canAbort,
    replyLoading,
    history,
    clsLoading,
    ctrl,
    setCanAbort,
    setReplyLoading,
    handleChat,
    appInfo.app_code,
    paramKey,
    resourceValue,
    currentDialogue.select_param,
    currentDialogue.conv_uid,
    scrollRef,
    refreshHistory,
  ]);

  const returnTools = (config: ToolsConfig[]) => {
    return (
      <>
        {config.map(item => (
          <Tooltip key={item.key} title={item.tip} arrow={false} placement='bottom'>
            <div
              className={`flex w-8 h-8 items-center justify-center rounded-md hover:bg-[rgb(221,221,221,0.6)] text-lg ${
                item.can_use ? 'cursor-pointer' : 'opacity-30 cursor-not-allowed'
              }`}
              onClick={() => {
                item.onClick?.();
              }}
            >
              {item.icon}
            </div>
          </Tooltip>
        ))}
      </>
    );
  };

  const fileName = useMemo(() => {
    try {
      // First try to get file_name from resourceValue
      if (resourceValue) {
        if (typeof resourceValue === 'string') {
          return JSON.parse(resourceValue).file_name || '';
        } else {
          return resourceValue.file_name || '';
        }
      }
      // Fall back to currentDialogue.select_param if resourceValue doesn't have file_name
      return JSON.parse(currentDialogue.select_param).file_name || '';
    } catch {
      return '';
    }
  }, [resourceValue, currentDialogue.select_param]);

  const ResourceItemsDisplay = () => {
    const resources = parseResourceValue(resourceValue) || parseResourceValue(currentDialogue.select_param) || [];

    if (resources.length === 0) return null;

    return (
      <div className='group/item flex flex-wrap gap-2 mt-2'>
        {resources.map((item, index) => {
          // Handle image type
          if (item.type === 'image_url' && item.image_url?.url) {
            const fileName = item.image_url.fileName;
            const previewUrl = transformFileUrl(item.image_url.url);
            return (
              <div
                key={`img-${index}`}
                className='flex flex-col border border-[#e3e4e6] dark:border-[rgba(255,255,255,0.6)] rounded-lg p-2'
              >
                {/* Add image preview */}
                <div className='w-32 h-32 mb-2 overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded'>
                  <img src={previewUrl} alt={fileName || 'Preview'} className='max-w-full max-h-full object-contain' />
                </div>
                <div className='flex items-center'>
                  <span className='text-sm text-[#1c2533] dark:text-white line-clamp-1'>{fileName}</span>
                </div>
              </div>
            );
          }
          // Handle file type
          else if (item.type === 'file_url' && item.file_url?.url) {
            const fileName = item.file_url.file_name;

            return (
              <div
                key={`file-${index}`}
                className='flex items-center justify-between border border-[#e3e4e6] dark:border-[rgba(255,255,255,0.6)] rounded-lg p-2'
              >
                <div className='flex items-center'>
                  <Image src={`/icons/chat/excel.png`} width={20} height={20} alt='file-icon' className='mr-2' />
                  <span className='text-sm text-[#1c2533] dark:text-white line-clamp-1'>{fileName}</span>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    );
  };

  return (
    <div className='flex flex-col  mb-2'>
      <div className='flex items-center justify-between h-full w-full'>
        <div className='flex gap-3 text-lg'>
          <Resource fileList={fileList} setFileList={setFileList} setLoading={setLoading} fileName={fileName} />
        </div>
        <div className='flex gap-1'>{returnTools(rightToolsConfig)}</div>
      </div>
      <ResourceItemsDisplay />
      <Spin spinning={loading} indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
    </div>
  );
};

export default ToolsBar;
