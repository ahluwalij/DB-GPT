import { ChatContext } from '@/app/chat-context';
import i18n from '@/app/i18n';
import { getUserId } from '@/utils';
import { HEADER_USER_ID_KEY } from '@/utils/constants/index';
import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source';
import { message } from 'antd';
import { useCallback, useContext, useState } from 'react';

type Props = {
  queryAgentURL?: string;
  app_code?: string;
};

type ChatParams = {
  chatId: string;
  ctrl?: AbortController;
  data?: any;
  query?: Record<string, string>;
  onMessage: (message: string) => void;
  onClose?: () => void;
  onDone?: () => void;
  onError?: (content: string, error?: Error) => void;
};

const useChat = ({ queryAgentURL = '/api/v1/chat/completions', app_code }: Props) => {
  const [ctrl, setCtrl] = useState<AbortController>({} as AbortController);
  const { scene } = useContext(ChatContext);
  const chat = useCallback(
    async ({ data, chatId, onMessage, onClose, onDone, onError, ctrl }: ChatParams) => {
      ctrl && setCtrl(ctrl);
      if (!data?.user_input && !data?.doc_id) {
        message.warning(i18n.t('no_context_tip'));
        return;
      }

      // Ensure prompt_code is preserved and not overwritten
      const params: Record<string, any> = {
        conv_uid: chatId,
        app_code,
      };

      // Add data fields, ensuring prompt_code is set correctly
      if (data) {
        Object.keys(data).forEach(key => {
          params[key] = data[key];
        });
      }

      // Debug: Log the params object to verify prompt_code is included
      console.log('DEBUG - API request params:', params);
      console.log('DEBUG - prompt_code in params:', params.prompt_code);
      console.log('DEBUG - data object received:', data);
      console.log('DEBUG - select_param type:', typeof params.select_param);
      console.log('DEBUG - select_param value:', params.select_param);
      console.log('DEBUG - chat_mode:', params.chat_mode);
      console.log('DEBUG - app_code:', params.app_code);

      try {
        // Debug: Log the actual request body that will be sent
        const requestBody = JSON.stringify(params);
        console.log('DEBUG - API request body:', requestBody);

        await fetchEventSource(`${process.env.API_BASE_URL ?? ''}${queryAgentURL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [HEADER_USER_ID_KEY]: getUserId() ?? '',
          },
          body: requestBody,
          signal: ctrl ? ctrl.signal : null,
          openWhenHidden: true,
          async onopen(response) {
            if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
              return;
            }
            if (response.headers.get('content-type') === 'application/json') {
              response.json().then(data => {
                onMessage?.(data);
                onDone?.();
                ctrl && ctrl.abort();
              });
            }
          },
          onclose() {
            ctrl && ctrl.abort();
            onClose?.();
          },
          onerror(err) {
            throw new Error(err);
          },
          onmessage: event => {
            let message = event.data;
            
            // Debug logging
            console.log('DEBUG - SSE event data:', event.data);
            console.log('DEBUG - Current scene:', scene);
            console.log('DEBUG - Params chat_mode:', params.chat_mode);
            
            try {
              // For agent chat mode (including multi-resource scenarios)
              if (scene === 'chat_agent' || (params.chat_mode === 'chat_agent')) {
                const parsed = JSON.parse(message);
                console.log('DEBUG - Parsed agent message:', parsed);
                message = parsed.vis || parsed;
              } else {
                // For other chat modes
                const parsed = JSON.parse(event.data);
                console.log('DEBUG - Parsed non-agent message:', parsed);
                message = parsed.choices?.[0]?.message?.content || parsed;
              }
            } catch (e) {
              console.log('DEBUG - Parse error:', e);
              // If parsing fails, use the raw message
              // Only do string replacements if message is actually a string
              if (typeof message === 'string') {
                message = message.replaceAll('\\n', '\n');
              }
            }
            
            console.log('DEBUG - Final message to display:', message);
            
            if (typeof message === 'string') {
              if (message === '[DONE]') {
                onDone?.();
              } else if (message?.startsWith('[ERROR]')) {
                onError?.(message?.replace('[ERROR]', ''));
              } else {
                onMessage?.(message);
              }
            } else {
              // Handle non-string messages (could be objects or other types)
              onMessage?.(JSON.stringify(message));
              onDone?.();
            }
          },
        });
      } catch (err) {
        ctrl && ctrl.abort();
        onError?.('Sorry, an error occurred, please try again later.', err as Error);
      }
    },
    [queryAgentURL, app_code, scene],
  );

  return { chat, ctrl };
};

export default useChat;
