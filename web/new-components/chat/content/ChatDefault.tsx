import { ChatContext } from '@/app/chat-context';
import { apiInterceptors, newDialogue } from '@/client/api';
import { getRecommendQuestions } from '@/client/api/chat';
import ChatInput from '@/new-components/chat/input/ChatInput';
import { STORAGE_INIT_MESSAGE_KET } from '@/utils';
import { useRequest } from 'ahooks';
import { ConfigProvider, Card } from 'antd';
import { t } from 'i18next';
import SafeImage from '@/components/common/SafeImage';
import { useRouter } from 'next/router';
import { useContext } from 'react';
import AppDefaultIcon from '@/new-components/common/AppDefaultIcon';

function ChatDefault() {
  const { setCurrentDialogInfo, model } = useContext(ChatContext);
  const router = useRouter();

  const chatModes = [
    // {
    //   key: 'chat_excel',
    //   name: 'Chat Excel',
    //   description: 'Analyze and chat with Excel files',
    //   scene: 'chat_excel'
    // },
    {
      key: 'chat_with_db_execute',
      name: 'Chat Data',
      description: 'Query and analyze your data with natural language',
      scene: 'chat_with_db_execute'
    }
  ];

  const startChat = async (chatMode: string) => {
    const [, res] = await apiInterceptors(newDialogue({ chat_mode: chatMode, model }));
    if (res) {
      setCurrentDialogInfo?.({
        chat_scene: res.chat_mode,
        app_code: '',
      });
      localStorage.setItem(
        'cur_dialog_info',
        JSON.stringify({
          chat_scene: res.chat_mode,
          app_code: '',
        }),
      );
      router.push(`/chat?scene=${chatMode}&id=${res.conv_uid}${model ? `&model=${model}` : ''}`);
    }
  };

  // 获取推荐问题
  const { data: helps } = useRequest(async () => {
    const [, res] = await apiInterceptors(getRecommendQuestions({ is_hot_question: 'true' }));
    return res ?? [];
  });

  return (
    <ConfigProvider
      theme={{
        components: {
          Button: {
            defaultBorderColor: 'white',
          },
          Card: {
            borderRadius: 16,
          },
        },
      }}
    >
      <div className='px-28 py-10 h-full flex flex-col justify-between'>
        <div>
          <div className='flex justify-center mb-8'>
            <h1 className='text-3xl font-bold text-gray-800 dark:text-white'>Choose Your Chat Mode</h1>
          </div>
          
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-8'>
            {chatModes.map(mode => (
              <Card
                key={mode.key}
                hoverable
                className='text-center cursor-pointer backdrop-filter backdrop-blur-lg bg-white bg-opacity-80 border border-white dark:bg-[#6f7f95] dark:bg-opacity-60 dark:border-[#6f7f95]'
                onClick={() => startChat(mode.scene)}
              >
                <div className='flex flex-col items-center p-4'>
                  <div className='mb-4'>
                    <AppDefaultIcon scene={mode.scene} width={12} height={12} />
                  </div>
                  <h3 className='text-xl font-semibold mb-2 text-gray-800 dark:text-white'>{mode.name}</h3>
                  <p className='text-gray-600 dark:text-gray-300'>{mode.description}</p>
                </div>
              </Card>
            ))}
          </div>

          {helps && helps.length > 0 && (
            <div className='mt-12'>
              <h2 className='font-medium text-xl my-4 text-center text-gray-800 dark:text-white'>Quick Help</h2>
              <div className='flex justify-center gap-4 flex-wrap'>
                {helps.map(help => (
                  <span
                    key={help.id}
                    className='flex gap-4 items-center backdrop-filter backdrop-blur-lg cursor-pointer bg-white bg-opacity-70 border-0 rounded-lg shadow p-2 relative dark:bg-[#6f7f95] dark:bg-opacity-60'
                    onClick={async () => {
                      const [, res] = await apiInterceptors(newDialogue({ chat_mode: 'chat_knowledge', model }));
                      if (res) {
                        setCurrentDialogInfo?.({
                          chat_scene: res.chat_mode,
                          app_code: help.app_code,
                        });
                        localStorage.setItem(
                          'cur_dialog_info',
                          JSON.stringify({
                            chat_scene: res.chat_mode,
                            app_code: help.app_code,
                          }),
                        );
                        localStorage.setItem(
                          STORAGE_INIT_MESSAGE_KET,
                          JSON.stringify({ id: res.conv_uid, message: help.question }),
                        );
                        router.push(`/chat/?scene=${res.chat_mode}&id=${res?.conv_uid}`);
                      }
                    }}
                  >
                    <span>{help.question}</span>
                    <SafeImage key='image_explore' src={'/icons/send.png'} alt='construct_image' width={20} height={20} />
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div>
          <ChatInput />
        </div>
      </div>
    </ConfigProvider>
  );
}

export default ChatDefault;
