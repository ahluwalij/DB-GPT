import { sendSpacePostRequest } from '@/utils/request';
import { useRequest } from 'ahooks';
import { Badge, Button, Dropdown, message } from 'antd';
import { CheckCircleOutlined, SettingOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type ContextSelectorProps = {
  onContextSelect: (context: any) => void;
  chat_scene?: string;
  currentContext?: string;
};

const ContextSelector: React.FC<ContextSelectorProps> = ({ onContextSelect, chat_scene, currentContext }) => {
  const { t } = useTranslation();
  const [selectedContext, setSelectedContext] = useState<any>(null);

  const { data, loading, run } = useRequest(
    () => {
      const body: any = {};
      if (chat_scene) {
        body.chat_scene = chat_scene;
      }
      return sendSpacePostRequest('/prompt/list', body);
    },
    {
      refreshDeps: [chat_scene],
      onError: err => {
        message.error(err?.message);
      },
      manual: true,
    },
  );

  const handleContextSelect = (context: any) => {
    setSelectedContext(context);
    onContextSelect(context);
    message.success(`Context "${context.prompt_name}" is now active`);
  };

  const handleClearContext = () => {
    setSelectedContext(null);
    localStorage.removeItem(`dbgpt_prompt_code_${new URLSearchParams(window.location.search).get('id') || ''}`);
    message.success('Context cleared');
  };

  const contextOptions = [
    {
      key: 'header',
      type: 'group',
      label: (
        <div className="flex items-center justify-between p-2 border-b">
          <span className="font-medium">Available Contexts</span>
          <Badge count={data?.data?.length || 0} size="small" />
        </div>
      ),
    },
    ...(data?.data || []).map((context: any) => ({
      key: context.prompt_code,
      label: (
        <div className="p-2 hover:bg-gray-50 cursor-pointer" onClick={() => handleContextSelect(context)}>
          <div className="font-medium text-gray-900">{context.prompt_name}</div>
          <div className="text-sm text-gray-500 truncate max-w-xs">
            {context.chat_scene} | {context.sub_chat_scene}
          </div>
        </div>
      ),
    })),
  ];

  useEffect(() => {
    run();
  }, [run]);

  // Load previously selected context from localStorage when data is available
  useEffect(() => {
    const chatId = new URLSearchParams(window.location.search).get('id') || '';
    const savedPromptCode = localStorage.getItem(`dbgpt_prompt_code_${chatId}`);
    if (savedPromptCode && data?.data) {
      const foundContext = data.data.find((ctx: any) => ctx.prompt_code === savedPromptCode);
      if (foundContext) {
        setSelectedContext(foundContext);
      }
    }
  }, [data]);

  return (
    <div className="flex items-center gap-2">
      {selectedContext ? (
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
          <CheckCircleOutlined className="text-gray-500" />
          <span className="text-sm font-medium text-gray-800">
            {selectedContext.prompt_name}
          </span>
          <Button
            size="small"
            type="text"
            onClick={handleClearContext}
            className="text-gray-600 hover:text-gray-800"
          >
            ×
          </Button>
        </div>
      ) : (
        <div className="text-xs text-gray-500">No context selected</div>
      )}
      
      <Dropdown
        menu={{ items: contextOptions }}
        placement="topRight"
        trigger={['click']}
        onOpenChange={(open) => {
          if (open) {
            run();
          }
        }}
      >
        <Button
          size="small"
          icon={<SettingOutlined />}
          loading={loading}
          className="border-gray-300 hover:border-gray-400"
        >
          {selectedContext ? 'Change Context' : 'Select Context'}
        </Button>
      </Dropdown>
    </div>
  );
};

export default ContextSelector; 