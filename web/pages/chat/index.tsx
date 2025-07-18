import { ChatContext } from '@/app/chat-context';
import { apiInterceptors, getAppInfo, getChatHistory, getDialogueList, newDialogue } from '@/client/api';

import useChat from '@/hooks/use-chat';
import ChatContentContainer from '@/new-components/chat/ChatContentContainer';
import ChatInputPanel from '@/new-components/chat/input/ChatInputPanel';
import { ChatGreeting } from '@/components/chat/chat-greeting';
// import ChatSider from '@/new-components/chat/sider/ChatSider';
import { IApp } from '@/types/app';
import { ChartData, ChatHistoryResponse, IChatDialogueSchema, UserChatContent } from '@/types/chat';
import { getInitMessage, transformFileUrl } from '@/utils';
import { useAsyncEffect, useRequest } from 'ahooks';
import { Flex, Layout, Spin, message } from 'antd';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const DbEditor = dynamic(() => import('@/components/chat/db-editor'), {
  ssr: false,
});
const ChatContainer = dynamic(() => import('@/components/chat/chat-container'), { ssr: false });


interface ChatContentProps {
  history: ChatHistoryResponse; // 会话记录列表
  replyLoading: boolean; // 对话回复loading
  scrollRef: React.RefObject<HTMLDivElement>; // 会话内容可滚动dom
  canAbort: boolean; // 是否能中断回复
  chartsData: ChartData[];
  agent: string;
  currentDialogue: IChatDialogueSchema; // 当前选择的会话
  appInfo: IApp;
  temperatureValue: any;
  maxNewTokensValue: any;
  resourceValue: any;
  modelValue: string;
  setModelValue: React.Dispatch<React.SetStateAction<string>>;

  setResourceValue: React.Dispatch<React.SetStateAction<any>>;
  setAppInfo: React.Dispatch<React.SetStateAction<IApp>>;
  setAgent: React.Dispatch<React.SetStateAction<string>>;
  setCanAbort: React.Dispatch<React.SetStateAction<boolean>>;
  setReplyLoading: React.Dispatch<React.SetStateAction<boolean>>;
  handleChat: (content: UserChatContent, data?: Record<string, any>) => Promise<void>; // 处理会话请求逻辑函数
  refreshDialogList: () => void;
  refreshHistory: () => void;
  refreshAppInfo: () => void;
  setHistory: React.Dispatch<React.SetStateAction<ChatHistoryResponse>>;
}
export const ChatContentContext = createContext<ChatContentProps>({
  history: [],
  replyLoading: false,
  scrollRef: { current: null },
  canAbort: false,
  chartsData: [],
  agent: '',
  currentDialogue: {} as any,
  appInfo: {} as any,
  temperatureValue: 0.5,
  maxNewTokensValue: 1024,
  resourceValue: {},
  modelValue: '',
  setModelValue: () => {},
  setResourceValue: () => {},

  setAppInfo: () => {},
  setAgent: () => {},
  setCanAbort: () => {},
  setReplyLoading: () => {},
  refreshDialogList: () => {},
  refreshHistory: () => {},
  refreshAppInfo: () => {},
  setHistory: () => {},
  handleChat: () => Promise.resolve(),
});

const Chat: React.FC = () => {
  const router = useRouter();
  const { model, currentDialogInfo, setCurrentDialogInfo } = useContext(ChatContext);
  const { isContract, setIsContract, setIsMenuExpand } = useContext(ChatContext);
  const { chat, ctrl } = useChat({
    app_code: currentDialogInfo.app_code || '',
  });

  const searchParams = useSearchParams();
  const chatId = searchParams?.get('id') ?? '';
  const scene = searchParams?.get('scene') ?? '';
  const knowledgeId = searchParams?.get('knowledge_id') ?? '';
  const dbName = searchParams?.get('db_name') ?? '';

  const scrollRef = useRef<HTMLDivElement>(null);
  const order = useRef<number>(1);

  // Create ref for ChatInputPanel to control input value externally
  const chatInputRef = useRef<any>(null);

  // Use ref to store the selected prompt_code
  const selectedPromptCodeRef = useRef<string | undefined>(undefined);

  const [history, setHistory] = useState<ChatHistoryResponse>([]);
  const [chartsData] = useState<Array<ChartData>>();
  const [replyLoading, setReplyLoading] = useState<boolean>(false);
  const [canAbort, setCanAbort] = useState<boolean>(false);
  const [agent, setAgent] = useState<string>('');
  const [appInfo, setAppInfo] = useState<IApp>({} as IApp);
  // Hidden technical parameters - business users don't need to see these
  const temperatureValue = 0;
  const maxNewTokensValue = 4000;
  const [resourceValue, setResourceValue] = useState<any>();
  const [modelValue, setModelValue] = useState<string>('');
  const [hasMessages, setHasMessages] = useState<boolean>(false);

  useEffect(() => {
    // Prefer o3 model, fall back to appInfo model or context model
    const appModel = appInfo?.param_need?.filter(item => item.type === 'model')[0]?.value;
    const preferredModel = (appModel && appModel.toLowerCase().includes('o3')) ? appModel : 
                          (model && model.toLowerCase().includes('o3')) ? model :
                          appModel || model;
    setModelValue(preferredModel);
    setResourceValue(
      knowledgeId || dbName || appInfo?.param_need?.filter(item => item.type === 'resource')[0]?.bind_value,
    );
  }, [appInfo, dbName, knowledgeId, model]);

  // Clear resource value when switching between incompatible chat modes
  useEffect(() => {
    const databaseScenes = ['chat_with_db_qa', 'chat_with_db_execute', 'chat_dashboard'];
    const knowledgeScenes = ['chat_knowledge'];
    
    const resourceType = appInfo?.param_need?.find(item => item.type === 'resource')?.value;
    
    // If we have a resource value but the resource type has changed
    if (resourceValue && resourceType) {
      // Check if we're switching from database to knowledge or vice versa
      const wasDatabase = databaseScenes.includes(currentDialogInfo.chat_scene || '');
      const isDatabase = resourceType === 'database';
      const wasKnowledge = knowledgeScenes.includes(currentDialogInfo.chat_scene || '');
      const isKnowledge = resourceType === 'knowledge';
      
      if ((wasDatabase && isKnowledge) || (wasKnowledge && isDatabase)) {
        // Clear resource value when switching between incompatible types
        setResourceValue(undefined);
      }
    }
  }, [scene, appInfo, currentDialogInfo.chat_scene]);

  useEffect(() => {
    // 仅初始化执行，防止dashboard页面无法切换状态
    setIsMenuExpand(scene !== 'chat_dashboard');
    // 路由变了要取消Editor模式，再进来是默认的Preview模式
    if (chatId && scene) {
      setIsContract(false);
    }
  }, [chatId, scene, setIsContract, setIsMenuExpand]);

  // Auto-redirect to Chat Data when no chat ID or scene is present
  useEffect(() => {
    const shouldRedirect = !chatId && !scene;
    if (shouldRedirect) {
      const createChatDataSession = async () => {
        try {
          const [, res] = await apiInterceptors(newDialogue({ chat_mode: 'chat_with_db_execute', model }));
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
            router.push(`/chat?scene=chat_with_db_execute&id=${res.conv_uid}${model ? `&model=${model}` : ''}`);
          }
        } catch (error) {
          console.error('Failed to create chat data session:', error);
        }
      };
      createChatDataSession();
    }
  }, [chatId, scene, model, router, setCurrentDialogInfo]);

  // 是否是默认小助手
  const isChatDefault = useMemo(() => {
    return !chatId && !scene;
  }, [chatId, scene]);

  // 获取会话列表
  const {
    data: dialogueList = [],
    refresh: refreshDialogList,
    loading: listLoading,
  } = useRequest(async () => {
    return await apiInterceptors(getDialogueList());
  });

  // 获取应用详情
  const { run: queryAppInfo, refresh: refreshAppInfo } = useRequest(
    async () =>
      await apiInterceptors(
        getAppInfo({
          ...currentDialogInfo,
        }),
      ),
    {
      manual: true,
      onSuccess: data => {
        const [, res] = data;
        setAppInfo(res || ({} as IApp));
      },
    },
  );

  // 列表当前活跃对话
  const currentDialogue = useMemo(() => {
    const [, list] = dialogueList;
    return list?.find(item => item.conv_uid === chatId) || ({} as IChatDialogueSchema);
  }, [chatId, dialogueList]);

  useEffect(() => {
    const initMessage = getInitMessage();
    if (currentDialogInfo.chat_scene === scene && !isChatDefault && !(initMessage && initMessage.message)) {
      queryAppInfo();
    }
  }, [chatId, currentDialogInfo, isChatDefault, queryAppInfo, scene]);

  // 获取会话历史记录
  const {
    run: getHistory,
    loading: historyLoading,
    refresh: refreshHistory,
  } = useRequest(async () => await apiInterceptors(getChatHistory(chatId)), {
    manual: true,
    onSuccess: data => {
      const [, res] = data;
      const viewList = res?.filter(item => item.role === 'view');
      if (viewList && viewList.length > 0) {
        order.current = viewList[viewList.length - 1].order + 1;
      }
      setHistory(res || []);
      // Set hasMessages based on existing history
      setHasMessages((res || []).length > 0);
    },
  });

  // 会话提问
  const handleChat = useCallback(
    (content: UserChatContent, data?: Record<string, any>) => {
      return new Promise<void>(resolve => {
        const initMessage = getInitMessage();
        const ctrl = new AbortController();
        setReplyLoading(true);
        setHasMessages(true);
        
        let currentOrder = order.current;
        if (history && history.length > 0) {
          const viewList = history?.filter(item => item.role === 'view');
          const humanList = history?.filter(item => item.role === 'human');
          currentOrder = (viewList[viewList.length - 1]?.order || humanList[humanList.length - 1]?.order) + 1;
        }
        
        // Process the content based on its type
        let formattedDisplayContent: string = '';

        if (typeof content === 'string') {
          formattedDisplayContent = content;
        } else {
          // Extract content items for display formatting
          const contentItems = content.content || [];
          const textItems = contentItems.filter(item => item.type === 'text');
          const mediaItems = contentItems.filter(item => item.type !== 'text');

          // Format for display in the UI - extract text for main message
          if (textItems.length > 0) {
            // Use the text content for the main message display
            formattedDisplayContent = textItems.map(item => item.text).join(' ');
          }

          // Format media items for display (using markdown)
          const mediaMarkdown = mediaItems
            .map(item => {
              if (item.type === 'image_url') {
                const originalUrl = item.image_url?.url || '';
                // Transform the URL to a service URL that can be displayed
                const displayUrl = transformFileUrl(originalUrl);
                const fileName = item.image_url?.fileName || 'image';
                return `\n![${fileName}](${displayUrl})`;
              } else if (item.type === 'video') {
                const originalUrl = item.video || '';
                const displayUrl = transformFileUrl(originalUrl);
                return `\n[Video](${displayUrl})`;
              } else {
                return `\n[${item.type} attachment]`;
              }
            })
            .join('\n');

          // Combine text and media markup
          if (mediaMarkdown) {
            formattedDisplayContent = formattedDisplayContent + '\n' + mediaMarkdown;
          }
        }

        // Add initial messages to history
        const newMessages = [
          {
            role: 'human' as const,
            context: formattedDisplayContent,
            model_name: data?.model_name || modelValue,
            order: currentOrder,
            time_stamp: 0,
          },
          {
            role: 'view' as const,
            context: '',
            model_name: data?.model_name || modelValue,
            order: currentOrder,
            time_stamp: 0,
            thinking: true,
          },
        ];

        // Update history with initial messages
        setHistory(prevHistory => {
          const baseHistory = initMessage && initMessage.id === chatId ? [] : prevHistory;
          return [...baseHistory, ...newMessages];
        });

        // Create data object with all fields
        const apiData: Record<string, any> = {
          chat_mode: scene,
          model_name: modelValue,
          user_input: content,
        };

        // Add other data fields
        if (data) {
          Object.assign(apiData, data);
        }

        // For non-dashboard scenes, try to get prompt_code from ref or localStorage
        if (scene !== 'chat_dashboard') {
          const finalPromptCode = selectedPromptCodeRef.current || localStorage.getItem(`dbgpt_prompt_code_${chatId}`);
          if (finalPromptCode) {
            apiData.prompt_code = finalPromptCode;
            localStorage.removeItem(`dbgpt_prompt_code_${chatId}`);
          }
        }

        chat({
          data: apiData,
          ctrl,
          chatId,
          onMessage: message => {
            setCanAbort(true);
            // Use functional update to avoid closure dependency issues
            setHistory(prevHistory => {
              const newHistory = [...prevHistory];
              const lastIndex = newHistory.length - 1;
              
              if (lastIndex >= 0 && newHistory[lastIndex].role === 'view') {
                if (data?.incremental) {
                  newHistory[lastIndex].context += message;
                } else {
                  newHistory[lastIndex].context = message;
                }
                newHistory[lastIndex].thinking = false;
              }
              
              return newHistory;
            });
          },
          onDone: () => {
            setReplyLoading(false);
            setCanAbort(false);
            resolve();
          },
          onClose: () => {
            setReplyLoading(false);
            setCanAbort(false);
            resolve();
          },
          onError: message => {
            setReplyLoading(false);
            setCanAbort(false);
            // Use functional update for error handling too
            setHistory(prevHistory => {
              const newHistory = [...prevHistory];
              const lastIndex = newHistory.length - 1;
              
              if (lastIndex >= 0 && newHistory[lastIndex].role === 'view') {
                newHistory[lastIndex].context = message;
                newHistory[lastIndex].thinking = false;
              }
              
              return newHistory;
            });
            resolve();
          },
        });
      });
    },
    [chatId, modelValue, chat, scene], // Removed 'history' from dependencies
  );

  useAsyncEffect(async () => {
    // 如果是默认小助手，不获取历史记录
    if (isChatDefault) {
      return;
    }
    const initMessage = getInitMessage();
    if (initMessage && initMessage.id === chatId) {
      return;
    }
    await getHistory();
  }, [chatId, scene, getHistory]);

  useEffect(() => {
    if (isChatDefault) {
      order.current = 1;
      setHistory([]);
    }
  }, [isChatDefault]);

  const contentRender = () => {
    if (scene === 'chat_dashboard') {
      return isContract ? <DbEditor /> : <ChatContainer />;
    } else {
      return (
        <div className='flex flex-col h-full bg-white relative'>
          <Spin spinning={historyLoading} className='absolute inset-0' />
          {hasMessages ? (
            <>
              <ChatContentContainer ref={scrollRef} className='flex-1 overflow-y-auto' />
              <motion.div
                className='w-full'
                initial={false}
                animate={{
                  y: 0,
                  scale: 1,
                }}
                transition={{
                  duration: 0.6,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                <ChatInputPanel ref={chatInputRef} ctrl={ctrl} />
              </motion.div>
            </>
          ) : (
            <div className='flex-1 flex items-center justify-center'>
              <div className='w-full max-w-4xl'>
                <ChatGreeting />
                <motion.div
                  className='w-full mt-4'
                  initial={false}
                  animate={{
                    y: 0,
                    scale: 1,
                  }}
                  transition={{
                    duration: 0.6,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                >
                  <ChatInputPanel ref={chatInputRef} ctrl={ctrl} />
                </motion.div>
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <ChatContentContext.Provider
      value={{
        history,
        replyLoading,
        scrollRef,
        canAbort,
        chartsData: chartsData || [],
        agent,
        currentDialogue,
        appInfo,
        temperatureValue,
        maxNewTokensValue,
        resourceValue,
        modelValue,
        setModelValue,
        setResourceValue,

        setAppInfo,
        setAgent,
        setCanAbort,
        setReplyLoading,
        handleChat,
        refreshDialogList,
        refreshHistory,
        refreshAppInfo,
        setHistory,
      }}
    >
      <div className='flex flex-col h-full'>
        <Layout className='flex-1 bg-gradient-light bg-cover bg-center dark:bg-gradient-dark' style={{ display: 'flex', flexDirection: 'column' }}>
          <Layout className='h-full bg-transparent' style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {contentRender()}
          </Layout>
        </Layout>
      </div>
    </ChatContentContext.Provider>
  );
};

export default Chat;
