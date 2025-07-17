import { ChatContentContext } from '@/pages/chat';
import { Badge } from 'antd';
import React, { memo, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import ModelIcon from '../content/ModelIcon';

const ModelSwitcher: React.FC = () => {
  const { appInfo, modelValue } = useContext(ChatContentContext);

  const { t } = useTranslation();

  // 左边工具栏动态可用key
  const paramKey: string[] = useMemo(() => {
    return appInfo.param_need?.map(i => i.type) || [];
  }, [appInfo.param_need]);

  if (!paramKey.includes('model') || !modelValue) {
    return null;
  }

  return (
    <Badge
      count={0}
      showZero={false}
      className='flex items-center'
    >
      <div className='flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm'>
        <ModelIcon model={modelValue} />
        <span className='ml-2 text-gray-700 dark:text-gray-300'>{modelValue}</span>
      </div>
    </Badge>
  );
};

export default memo(ModelSwitcher);
