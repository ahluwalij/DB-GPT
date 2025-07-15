import AppDefaultIcon from '@/new-components/common/AppDefaultIcon';
import { Typography } from 'antd';
import React, { memo, useContext } from 'react';
import { MobileChatContext } from '../';

const Header: React.FC = () => {
  const { appInfo } = useContext(MobileChatContext);

  if (!appInfo?.app_code) {
    return null;
  }

  return (
    <header className='flex w-full items-center bg-[rgba(255,255,255,0.9)] border dark:bg-black dark:border-[rgba(255,255,255,0.6)] rounded-xl mx-auto px-4 py-2 mb-4 sticky top-4 z-50 mt-4 shadow-md'>
      <div className='flex gap-2 items-center'>
        <AppDefaultIcon scene={appInfo?.team_context?.chat_scene || 'chat_agent'} width={8} height={8} />
        <div className='flex flex-col ml-2'>
          <Typography.Text className='text-md font-bold line-clamp-2'>{appInfo?.app_name}</Typography.Text>
          <Typography.Text className='text-sm line-clamp-2'>{appInfo?.app_describe}</Typography.Text>
        </div>
      </div>
    </header>
  );
};
export default memo(Header);
