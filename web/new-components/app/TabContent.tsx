import { ChatContext } from '@/app/chat-context';
import { apiInterceptors, newDialogue } from '@/client/api';
import BlurredCard from '@/new-components/common/blurredCard';
import { IApp } from '@/types/app';
import { Avatar, Empty, Spin } from 'antd';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useContext, useMemo } from 'react';
import IconFont from '../common/Icon';

const TabContent: React.FC<{ apps: IApp[]; loading: boolean; refresh: () => void; type: 'used' | 'recommend' }> = ({
  apps,
  refresh,
  loading,
  type,
}) => {
  const { setAgent: setAgentToChat, model, setCurrentDialogInfo } = useContext(ChatContext);
  const router = useRouter();

  // Filter apps to only show those with specific chat scenes
  const filteredApps = useMemo(() => {
    const allowedScenes = ['chat_excel', 'chat_dashboard', 'chat_with_db_execute'];
    return apps.filter(app => {
      // For native apps, check the chat_scene in team_context
      if (app.team_mode === 'native_app' && app.team_context?.chat_scene) {
        return allowedScenes.includes(app.team_context.chat_scene);
      }
      // For custom apps, include all since they use chat_agent
      return false; // Only show native apps with specific scenes
    });
  }, [apps]);

  const toChat = async (data: IApp) => {
    // 原生应用跳转
    if (data.team_mode === 'native_app') {
      const { chat_scene = '' } = data.team_context;
      const [, res] = await apiInterceptors(newDialogue({ chat_mode: chat_scene }));
      if (res) {
        setCurrentDialogInfo?.({
          chat_scene: res.chat_mode,
          app_code: data.app_code,
        });
        localStorage.setItem(
          'cur_dialog_info',
          JSON.stringify({
            chat_scene: res.chat_mode,
            app_code: data.app_code,
          }),
        );
        router.push(`/chat?scene=${chat_scene}&id=${res.conv_uid}${model ? `&model=${model}` : ''}`);
      }
    } else {
      // 自定义应用
      const [, res] = await apiInterceptors(newDialogue({ chat_mode: 'chat_agent' }));
      if (res) {
        setCurrentDialogInfo?.({
          chat_scene: res.chat_mode,
          app_code: data.app_code,
        });
        localStorage.setItem(
          'cur_dialog_info',
          JSON.stringify({
            chat_scene: res.chat_mode,
            app_code: data.app_code,
          }),
        );
        setAgentToChat?.(data.app_code);
        router.push(`/chat/?scene=chat_agent&id=${res.conv_uid}${model ? `&model=${model}` : ''}`);
      }
    }
  };

  if (loading) {
    return <Spin size='large' className='flex items-center justify-center h-full' spinning={loading} />;
  }
  return (
    <div className='flex flex-wrap mt-4 w-full overflow-y-auto '>
      {filteredApps?.length > 0 ? (
        filteredApps.map(item => (
          <BlurredCard
            key={item.app_code}
            name={item.app_name}
            description={item.app_describe}
            onClick={() => toChat(item)}

            scene={item?.team_context?.chat_scene || 'chat_agent'}
          />
        ))
      ) : (
        <Empty
          image={
            <Image src='/pictures/empty.png' alt='empty' width={142} height={133} className='w-[142px] h-[133px]' />
          }
          className='flex justify-center items-center w-full h-full min-h-[200px]'
        />
      )}
    </div>
  );
};

export default TabContent;
