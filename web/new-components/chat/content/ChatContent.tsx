import markdownComponents, { markdownPlugins, preprocessLaTeX } from '@/components/chat/chat-content/config';
import { IChatDialogueMessageSchema } from '@/types/chat';
import { STORAGE_USERINFO_KEY } from '@/utils/constants/index';
import {
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  CodeOutlined,
  LoadingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { GPTVis } from '@antv/gpt-vis';
import { message } from 'antd';
import classNames from 'classnames';
import SafeImage from '@/components/common/SafeImage';
import { useSearchParams } from 'next/navigation';
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Feedback from './Feedback';
// Icons removed for cleaner chat bubble design

type DBGPTView = {
  name: string;
  status: 'todo' | 'runing' | 'failed' | 'completed' | (string & {});
  result?: string;
  err_msg?: string;
};

type MarkdownComponent = Parameters<typeof GPTVis>['0']['components'];

const pluginViewStatusMapper: Record<DBGPTView['status'], { bgClass: string; icon: React.ReactNode }> = {
  todo: {
    bgClass: 'bg-gray-500',
    icon: <ClockCircleOutlined className='ml-2' />,
  },
  runing: {
    bgClass: 'bg-blue-500',
    icon: <LoadingOutlined className='ml-2' />,
  },
  failed: {
    bgClass: 'bg-red-500',
    icon: <CloseOutlined className='ml-2' />,
  },
  completed: {
    bgClass: 'bg-green-500',
    icon: <CheckOutlined className='ml-2' />,
  },
};

const formatMarkdownVal = (val: string) => {
  return val.replace(/<table(\w*=[^>]+)>/gi, '<table $1>').replace(/<tr(\w*=[^>]+)>/gi, '<tr $1>');
};

const formatMarkdownValForAgent = (val: string) => {
  return val?.replace(/<table(\w*=[^>]+)>/gi, '<table $1>').replace(/<tr(\w*=[^>]+)>/gi, '<tr $1>');
};

const ChatContent: React.FC<{
  content: Omit<IChatDialogueMessageSchema, 'context'> & {
    context:
      | string
      | {
          template_name: string;
          template_introduce: string;
        };
  };
  onLinkClick: () => void;
}> = ({ content, onLinkClick }) => {
  const { t } = useTranslation();

  const searchParams = useSearchParams();
  const scene = searchParams?.get('scene') ?? '';

  const { context, model_name, role, thinking } = content;

  const isRobot = useMemo(() => role === 'view', [role]);

  const { value, cachePluginContext } = useMemo<{
    relations: string[];
    value: string;
    cachePluginContext: DBGPTView[];
  }>(() => {
    if (typeof context !== 'string') {
      return {
        relations: [],
        value: '',
        cachePluginContext: [],
      };
    }
    const [value, relation] = context.split('\trelations:');
    const relations = relation ? relation.split(',') : [];
    const cachePluginContext: DBGPTView[] = [];

    let cacheIndex = 0;
    const result = value.replace(/<dbgpt-view[^>]*>[^<]*<\/dbgpt-view>/gi, matchVal => {
      try {
        const pluginVal = matchVal.replaceAll('\n', '\\n').replace(/<[^>]*>|<\/[^>]*>/gm, '');
        const pluginContext = JSON.parse(pluginVal) as DBGPTView;
        const replacement = `<custom-view>${cacheIndex}</custom-view>`;

        cachePluginContext.push({
          ...pluginContext,
          result: formatMarkdownVal(pluginContext.result ?? ''),
        });
        cacheIndex++;

        return replacement;
      } catch (e) {
        console.log((e as any).message, e);
        return matchVal;
      }
    });
    return {
      relations,
      cachePluginContext,
      value: result,
    };
  }, [context]);

  const extraMarkdownComponents = useMemo<MarkdownComponent>(
    () => ({
      'custom-view'({ children }) {
        const index = +children.toString();
        if (!cachePluginContext[index]) {
          return children;
        }
        const { name, status, err_msg, result } = cachePluginContext[index];
        const { bgClass, icon } = pluginViewStatusMapper[status] ?? {};
        return (
          <div className='bg-white dark:bg-[#212121] rounded-lg overflow-hidden my-2 flex flex-col lg:max-w-[80%]'>
            <div className={classNames('flex px-4 md:px-6 py-2 items-center text-white text-sm', bgClass)}>
              {name}
              {icon}
            </div>
            {result ? (
              <div className='px-4 md:px-6 py-4 text-sm'>
                <GPTVis components={markdownComponents} {...markdownPlugins}>
                  {preprocessLaTeX(result ?? '')}
                </GPTVis>
              </div>
            ) : (
              <div className='px-4 md:px-6 py-4 text-sm'>{err_msg}</div>
            )}
          </div>
        );
      },
    }),
    [cachePluginContext],
  );

  return (
    <div className={`flex gap-3 mt-6 ${isRobot ? `max-w-2xl ${thinking && !context ? 'w-auto' : 'w-full'}` : 'max-w-2xl ml-auto w-full'}`}>
      {/* Remove icons - no icon div needed */}
      <div className={`flex ${scene === 'chat_agent' && !thinking ? 'flex-1' : ''} ${thinking && !context ? 'w-auto' : 'w-full'} max-w-full`}>
        {/* 用户提问 */}
        {!isRobot && (
          <div className='flex flex-1 flex-col group/message'>
            <div
              className='flex-1 text-sm text-[#1c2533] dark:text-white bg-gray-100 dark:bg-gray-700 rounded-3xl px-4 py-3 max-w-fit ml-auto'
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            >
              {typeof context === 'string' && (
                <div>
                  <GPTVis
                    components={{
                      ...markdownComponents,
                      img: ({ src, alt, ...props }) => (
                        <img
                          src={src}
                          alt={alt || 'image'}
                          className='max-w-full md:max-w-[80%] lg:max-w-[70%] object-contain'
                          style={{ maxHeight: '200px' }}
                          {...props}
                        />
                      ),
                    }}
                    {...markdownPlugins}
                  >
                    {preprocessLaTeX(formatMarkdownVal(value))}
                  </GPTVis>
                </div>
              )}
            </div>
            {typeof context === 'string' && context.trim() && (
              <div className='flex justify-end mt-1 opacity-0 group-hover/message:opacity-100 transition-opacity duration-300'>
                <Button
                  variant="ghost"
                  size="sm"
                  className='size-3! p-4! hover:bg-gray-100'
                  onClick={() => {
                    if (typeof context === 'string') {
                      navigator.clipboard
                        .writeText(context)
                        .then(() => {
                          message.success(t('copy_to_clipboard_success'));
                        })
                        .catch(err => {
                          console.error(t('copy_to_clipboard_failed'), err);
                          message.error(t('copy_to_clipboard_failed'));
                        });
                    }
                  }}
                  title={t('copy_to_clipboard')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
        {/* ai回答 */}
        {isRobot && (
          <div className={`flex flex-1 flex-col group/message min-w-0 max-w-full ${thinking && !context ? 'w-auto' : 'w-full'}`}>
            <div className={`bg-gray-100 dark:bg-gray-700 p-4 rounded-2xl mb-2 min-w-0 max-w-full overflow-hidden ${thinking && !context ? 'w-auto' : 'w-full'}`}>
              {typeof context === 'object' && (
                <div>
                  {`[${context.template_name}]: `}
                  <span className='text-theme-primary cursor-pointer' onClick={onLinkClick}>
                    <CodeOutlined className='mr-1' />
                    {context.template_introduce || 'More Details'}
                  </span>
                </div>
              )}
              {typeof context === 'string' && scene === 'chat_agent' && (
                <div className='w-full max-w-full overflow-hidden'>
                  <GPTVis components={markdownComponents} {...markdownPlugins}>
                    {preprocessLaTeX(formatMarkdownValForAgent(value))}
                  </GPTVis>
                </div>
              )}
              {typeof context === 'string' && scene !== 'chat_agent' && (
                <div className='w-full max-w-full overflow-hidden'>
                  <GPTVis
                    components={{
                      ...markdownComponents,
                      ...extraMarkdownComponents,
                    }}
                    {...markdownPlugins}
                  >
                    {preprocessLaTeX(formatMarkdownVal(value))}
                  </GPTVis>
                </div>
              )}
              {/* 正在思考 */}
              {thinking && !context && (
                <div className='flex items-center justify-center'>
                  <div className='flex items-center gap-1'>
                    <div className='w-1 h-1 rounded-full bg-gray-400 animate-pulse1'></div>
                    <div className='w-1 h-1 rounded-full bg-gray-400 animate-pulse2'></div>
                    <div className='w-1 h-1 rounded-full bg-gray-400 animate-pulse3'></div>
                  </div>
                </div>
              )}
            </div>
            {/* 用户反馈 */}
            <Feedback content={content} />
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ChatContent);
