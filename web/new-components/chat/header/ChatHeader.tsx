import { ChatContentContext } from '@/pages/chat';
import { Typography } from 'antd';
import React, { useContext, useMemo } from 'react';

import AppDefaultIcon from '../../common/AppDefaultIcon';

const ChatHeader: React.FC<{ isScrollToTop: boolean }> = ({ isScrollToTop }) => {
  const { appInfo } = useContext(ChatContentContext);

  const appScene = useMemo(() => {
    return appInfo?.team_context?.chat_scene || 'chat_agent';
  }, [appInfo]);

  if (!Object.keys(appInfo).length) {
    return null;
  }

  // Clean header without community features
  const headerContent = () => {
    return (
      <header className='flex items-center w-5/6 h-full px-6 bg-[#ffffff99] border dark:bg-[rgba(255,255,255,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-2xl mx-auto transition-all duration-400 ease-in-out relative'>
        <div className='flex items-center w-full'>
          <div className='flex w-12 h-12 justify-center items-center rounded-xl mr-4 bg-white'>
            <AppDefaultIcon scene={appScene} width={16} height={16} />
          </div>
          <div className='flex flex-col flex-1'>
            <div className='text-base text-[#1c2533] dark:text-[rgba(255,255,255,0.85)] font-semibold'>
              <span>{appInfo?.app_name}</span>
            </div>
            <Typography.Text
              className='text-sm text-[#525964] dark:text-[rgba(255,255,255,0.65)] leading-6'
              ellipsis={{
                tooltip: true,
              }}
            >
              {appInfo?.app_describe}
            </Typography.Text>
          </div>
        </div>
      </header>
    );
  };

  // Clean top header without community features
  const topHeaderContent = () => {
    return (
      <header className='flex items-center w-full h-14 bg-[#ffffffb7] dark:bg-[rgba(41,63,89,0.4)] px-8 transition-all duration-500 ease-in-out'>
        <div className='flex items-center w-full'>
          <div className='flex items-center justify-center w-8 h-8 rounded-lg mr-2 bg-white'>
            <AppDefaultIcon scene={appScene} />
          </div>
          <div className='text-base text-[#1c2533] dark:text-[rgba(255,255,255,0.85)] font-semibold'>
            <span>{appInfo?.app_name}</span>
          </div>
        </div>
      </header>
    );
  };

  return (
    <div className='h-20 mt-6 sticky top-0 bg-transparent z-30 transition-all duration-400 ease-in-out'>
      {isScrollToTop ? topHeaderContent() : headerContent()}
    </div>
  );
};

export default ChatHeader;
