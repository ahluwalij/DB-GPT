import { ChatContentContext } from '@/pages/chat';
import { LoadingOutlined } from '@ant-design/icons';
import { Button, Input, Spin } from 'antd';
import classNames from 'classnames';
import { useSearchParams } from 'next/navigation';
import React, { forwardRef, useContext, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSidebarRefresh } from '@/components/layouts/sidebar-refresh-context';

import { UserChatContent } from '@/types/chat';
import { parseResourceValue } from '@/utils';
import ToolsBar from './ToolsBar';
import ModelSwitcher from './ModelSwitcher';

const ChatInputPanel: React.ForwardRefRenderFunction<any, { ctrl: AbortController }> = ({ ctrl }, ref) => {
  const { t } = useTranslation();
  const { refreshSidebar } = useSidebarRefresh();
  const {
    replyLoading,
    handleChat,
    appInfo,
    currentDialogue,
    temperatureValue,
    maxNewTokensValue,
    resourceValue,
    setResourceValue,
    refreshDialogList,
  } = useContext(ChatContentContext);

  const searchParams = useSearchParams();
  const scene = searchParams?.get('scene') ?? '';
  const select_param = searchParams?.get('select_param') ?? '';

  const [userInput, setUserInput] = useState<string>('');
  const [isFocus, setIsFocus] = useState<boolean>(false);
  const [isZhInput, setIsZhInput] = useState<boolean>(false);

  const submitCountRef = useRef(0);

  const paramKey: string[] = useMemo(() => {
    return appInfo.param_need?.map(i => i.type) || [];
  }, [appInfo.param_need]);

  // Check if datasource is required and connected
  const isDatasourceRequired = paramKey.includes('resource') && appInfo.param_need?.some(param => 
    param.type === 'resource' && param.value === 'database'
  );
  
  const isDatasourceConnected = resourceValue && 
    (Array.isArray(resourceValue) 
      ? resourceValue.length > 0 
      : resourceValue !== '' && resourceValue !== 'null' && resourceValue !== 'undefined');

  const onSubmit = async () => {
    submitCountRef.current++;
    // Remove immediate scroll to avoid conflict with ChatContentContainer's auto-scroll
    // ChatContentContainer will handle scrolling when new content is added
    setUserInput('');
    const resources = parseResourceValue(resourceValue);
    // Prepare user input
    let newUserInput: UserChatContent;
    
    // parseResourceValue is for file resources (images, videos, etc.) in Excel chat mode
    // For database/knowledge resources, they should only be in select_param, not in message content
    if (resources.length > 0 && scene === 'chat_excel') {
      // Only Chat Excel scene needs file resources in message content
      const messages = [...resources];
      messages.push({
        type: 'text',
        text: userInput,
      });
      newUserInput = {
        role: 'user',
        content: messages,
      };
    } else {
      // For database and knowledge resources, keep them in select_param only
      // Don't include them in message content to avoid validation errors
      newUserInput = userInput;
    }

    const params = {
      app_code: appInfo.app_code || '',
      ...(paramKey.includes('temperature') && { temperature: temperatureValue }),
      ...(paramKey.includes('max_new_tokens') && { max_new_tokens: maxNewTokensValue }),
      ...(paramKey.includes('resource') && {
        select_param: resourceValue || currentDialogue.select_param,
      }),
    };

    console.log('DEBUG - ChatInputPanel resourceValue:', resourceValue);
    console.log('DEBUG - ChatInputPanel params:', params);

    await handleChat(newUserInput, params);

    // Refresh dialog list and sidebar after each message to ensure conversation appears immediately
    await refreshDialogList();
    refreshSidebar();
  };

  // expose setUserInput to parent via ref
  useImperativeHandle(ref, () => ({
    setUserInput,
  }));

  return (
    <div className='flex flex-col w-5/6 max-w-4xl mx-auto pt-4 pb-6 bg-transparent'>
      <div
        className={`flex flex-1 flex-col bg-gray-100 dark:bg-gray-700 px-5 py-4 pt-2 rounded-xl relative border-t border-b border-l border-r dark:border-[rgba(255,255,255,0.6)] ${
          isFocus ? 'border-[#6B7280]' : ''
        }`}
        id='input-panel'
      >
        <ToolsBar ctrl={ctrl} />
        <Input.TextArea
          placeholder="Ask a question or request data analysis..."
          className='w-full h-20 resize-none border-0 p-0 focus:shadow-none bg-gray-100 dark:bg-gray-700'
          style={{ backgroundColor: '#f3f4f6' }}
          value={userInput}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              if (e.shiftKey) {
                return;
              }
              if (isZhInput) {
                return;
              }
              e.preventDefault();
              if (!userInput.trim() || replyLoading || (isDatasourceRequired && !isDatasourceConnected)) {
                return;
              }
              onSubmit();
            }
          }}
          onChange={e => {
            setUserInput(e.target.value);
          }}
          onFocus={() => {
            setIsFocus(true);
          }}
          onBlur={() => setIsFocus(false)}
          onCompositionStart={() => setIsZhInput(true)}
          onCompositionEnd={() => setIsZhInput(false)}
        />
        <div className='absolute right-4 bottom-3 flex items-center gap-2'>
          <ModelSwitcher />
          <Button
            type='primary'
            disabled={!userInput.trim() || (isDatasourceRequired && !isDatasourceConnected)}
            className={classNames(
              'flex items-center justify-center w-14 h-8 rounded-lg text-sm text-white border-0',
              {
                'bg-gray-700 hover:bg-gray-800': userInput.trim() && (!isDatasourceRequired || isDatasourceConnected),
                'bg-gray-400 cursor-not-allowed': !userInput.trim() || (isDatasourceRequired && !isDatasourceConnected),
              },
            )}
            onClick={() => {
              if (replyLoading || !userInput.trim() || (isDatasourceRequired && !isDatasourceConnected)) {
                return;
              }
              onSubmit();
            }}
          >
            {replyLoading ? (
              <Spin spinning={replyLoading} indicator={<LoadingOutlined className='text-white' />} />
            ) : (
              'Send'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default forwardRef(ChatInputPanel);
