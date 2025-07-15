import { ChatContext } from '@/app/chat-context';
import {
  addPrompt,
  apiInterceptors,
  getDbList,
  llmOutVerify,
  promptTemplateLoad,
  promptTypeTarget,
  updatePrompt,
} from '@/client/api';
import useUser from '@/hooks/use-user';
import ModelIcon from '@/new-components/chat/content/ModelIcon';
import { DebugParams, OperatePromptParams } from '@/types/prompt';
import { DbListResponse } from '@/types/db';
import { getUserId } from '@/utils';
import { HEADER_USER_ID_KEY } from '@/utils/constants/index';
import { LeftOutlined } from '@ant-design/icons';
import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source';
import JsonView from '@uiw/react-json-view';
import { githubDarkTheme } from '@uiw/react-json-view/githubDark';
import { githubLightTheme } from '@uiw/react-json-view/githubLight';
import { useRequest } from 'ahooks';
import { Alert, App, Button, Card, Form, Input, InputNumber, Select, Slider, Space } from 'antd';
import classNames from 'classnames';
import MarkdownIt from 'markdown-it';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import 'react-markdown-editor-lite/lib/index.css';
import styles from '../styles.module.css';

const MarkdownEditor = dynamic(() => import('react-markdown-editor-lite'), {
  ssr: false,
});
const mdParser = new MarkdownIt();

const MarkdownContext = dynamic(() => import('@/new-components/common/MarkdownContext'), { ssr: false });

// TypeOptions removed - always using Scene type

interface BottomFormProps {
  model: string;
  temperature: number;
  prompt_language: 'en' | 'zh';
}

interface TopFormProps {
  prompt_type: string;
  prompt_name: string;
  target: string;
  prompt_code: string;
}

// 自定义温度选项
const TemperatureItem: React.FC<{
  value?: any;
  onChange?: (value: any) => void;
}> = ({ value, onChange }) => {
  // temperature变化;
  const onTemperatureChange = (value: any) => {
    if (isNaN(value)) {
      return;
    }
    onChange?.(value);
  };

  return (
    <div className='flex items-center gap-8'>
      <Slider className='w-40' min={0} max={1} step={0.1} onChange={onTemperatureChange} value={value} />
      <InputNumber className='w-16' min={0} max={1} step={0.1} value={value} onChange={onTemperatureChange} />
    </div>
  );
};

const AddOrEditPrompt: React.FC = () => {
  const router = useRouter();
  const { type = '' } = router.query;
  const { t } = useTranslation();

  const { modelList, model, mode } = useContext(ChatContext);
  const theme = mode === 'dark' ? githubDarkTheme : githubLightTheme;

  const { message } = App.useApp();

  const userInfo = useUser();

  // prompt内容
  const [value, setValue] = useState<string>('');
  // 输入参数
  const [variables, setVariables] = useState<string[]>([]);
  // 输出结构
  const [responseTemplate, setResponseTemplate] = useState<any>({});
  // LLM输出
  const [history, setHistory] = useState<Record<string, any>[]>([]);
  const [llmLoading, setLlmLoading] = useState<boolean>(false);

  // prompt基本信息
  const [topForm] = Form.useForm<TopFormProps>();
  // 输入参数
  const [midForm] = Form.useForm();
  // 模型，温度，语言
  const [bottomForm] = Form.useForm<BottomFormProps>();
  // 验证错误信息
  const [errorMessage, setErrorMessage] = useState<Record<string, any>>();
  // Connected PostgreSQL databases
  const [postgresDbList, setPostgresDbList] = useState<DbListResponse>([]);

  const promptType = Form.useWatch('prompt_type', topForm);

  const modelOptions = useMemo(() => {
    return modelList.map(item => {
      return {
        value: item,
        label: (
          <div className='flex items-center'>
            <ModelIcon model={item} />
            <span className='ml-2'>{item}</span>
          </div>
        ),
      };
    });
  }, [modelList]);

  // md编辑器变化
  const onChange = useCallback((props: any) => {
    setValue(props.text);
  }, []);

  // 获取target选项
  const {
    data,
    run: getTargets,
  } = useRequest(async (type: string) => await promptTypeTarget(type), {
    manual: true,
  });

  // 获取template
  const { run: getTemplate } = useRequest(
    async (target: string) =>
      await promptTemplateLoad({
        prompt_type: promptType,
        target: target ?? '',
      }),
    {
      manual: true,
      onSuccess: res => {
        if (res) {
          const { data } = res.data;
          setValue(data.template);
          setVariables(data.input_variables);
          try {
            const jsonTemplate = JSON.parse(data.response_format);
            setResponseTemplate(jsonTemplate || {});
          } catch {
            setResponseTemplate({});
          }
        }
      },
    },
  );

  // add or edit prompt
  const { run: operatePrompt, loading: operateLoading } = useRequest(
    async (params: OperatePromptParams) => {
      if (type === 'add') {
        return await apiInterceptors(addPrompt(params));
      } else {
        return await apiInterceptors(updatePrompt(params));
      }
    },
    {
      manual: true,
      onSuccess: () => {
        message.success(`${type === 'add' ? t('Add') : t('update')} ${t('Success')}`);
        router.replace('/construct/prompt');
      },
    },
  );

  const operateFn = () => {
    topForm.validateFields().then(async values => {
      const params: OperatePromptParams = {
        sub_chat_scene: '',
        model: bottomForm.getFieldValue('model'),
        chat_scene: values.target,
        prompt_name: values.prompt_name,
        prompt_type: values.prompt_type,
        content: value,
        response_schema: JSON.stringify(responseTemplate),
        input_variables: JSON.stringify(variables),
        prompt_language: bottomForm.getFieldValue('prompt_language'),
        prompt_desc: '',
        user_name: userInfo.nick_name,
        ...(type === 'edit' && { prompt_code: values.prompt_code }),
      };
      await operatePrompt(params);
    });
  };

  // llm测试
  const onLLMTest = async () => {
    if (llmLoading) {
      return;
    }
    const midVals = midForm.getFieldsValue();
    if (!Object.values(midVals).every(value => !!value)) {
      message.warning(t('Please_complete_the_input_parameters'));
      return;
    }
    if (!bottomForm.getFieldValue('user_input')) {
      message.warning(t('Please_fill_in_the_user_input'));
      return;
    }
    topForm.validateFields().then(async values => {
      const params: DebugParams = {
        sub_chat_scene: '',
        model: bottomForm.getFieldValue('model'),
        chat_scene: values.target,
        prompt_name: values.prompt_name,
        prompt_type: values.prompt_type,
        content: value,
        response_schema: JSON.stringify(responseTemplate),
        input_variables: JSON.stringify(variables),
        prompt_language: bottomForm.getFieldValue('prompt_language'),
        prompt_desc: '',
        prompt_code: values.prompt_code,
        temperature: bottomForm.getFieldValue('temperature'),
        debug_model: bottomForm.getFieldValue('model'),
        input_values: {
          ...midVals,
        },
        user_input: bottomForm.getFieldValue('user_input'),
      };
      const tempHistory: Record<string, any>[] = [{ role: 'view', context: '' }];
      const index = tempHistory.length - 1;
      try {
        setLlmLoading(true);
        await fetchEventSource(`${process.env.API_BASE_URL ?? ''}/prompt/template/debug`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [HEADER_USER_ID_KEY]: getUserId() ?? '',
          },
          body: JSON.stringify(params),
          openWhenHidden: true,
          async onopen(response) {
            if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
              return;
            }
          },
          onclose() {
            setLlmLoading(false);
          },
          onerror(err) {
            throw new Error(err);
          },
          onmessage: event => {
            let message = event.data;
            if (!message) return;
            try {
              message = JSON.parse(message).vis;
            } catch {
              message.replaceAll('\\n', '\n');
            }
            if (message === '[DONE]') {
              setLlmLoading(false);
            } else if (message?.startsWith('[ERROR]')) {
              setLlmLoading(false);
              tempHistory[index].context = message?.replace('[ERROR]', '');
            } else {
              tempHistory[index].context = message;
              setHistory([...tempHistory]);
            }
          },
        });
      } catch {
        setLlmLoading(false);
        tempHistory[index].context = 'Sorry, we meet some error, please try again later';
        setHistory([...tempHistory]);
      }
    });
  };

  // 输出验证
  const { run, loading: verifyLoading } = useRequest(
    async () =>
      await llmOutVerify({
        llm_out: history[0].context,
        prompt_type: topForm.getFieldValue('prompt_type'),
        chat_scene: topForm.getFieldValue('target'),
      }),
    {
      manual: true,
      onSuccess: res => {
        if (res?.data?.success) {
          setErrorMessage({ msg: '验证通过', status: 'success' });
        } else {
          setErrorMessage({ msg: res?.data?.err_msg, status: 'error' });
        }
      },
    },
  );

  // 设置默认模型
  useEffect(() => {
    if (model) {
      bottomForm.setFieldsValue({
        model,
      });
    }
  }, [bottomForm, model]);

  // 类型改变获取相应的场景
  useEffect(() => {
    if (promptType) {
      getTargets(promptType);
    }
  }, [getTargets, promptType]);

  const targetOptions = useMemo(() => {
    return data?.data?.data?.map((option: any) => {
      return {
        ...option,
        value: option.name,
        label: option.name,
      };
    });
  }, [data]);

  // Auto-load template for Scene + chat_with_db_execute when targets are loaded for new context
  useEffect(() => {
    if (type === 'add' && promptType === 'Scene' && targetOptions && targetOptions.length > 0) {
      const hasDbExecute = targetOptions.some(option => option.value === 'chat_with_db_execute');
      if (hasDbExecute) {
        // Always load the chat_with_db_execute template for new contexts
        getTemplate('chat_with_db_execute');
      }
    }
  }, [type, promptType, targetOptions, getTemplate]);

  // Load PostgreSQL databases
  useEffect(() => {
    const loadPostgresDbList = async () => {
      const [, data] = await apiInterceptors(getDbList());
      if (data) {
        // Filter for PostgreSQL databases only
        const postgresOnly = data.filter(db => db.type?.toLowerCase() === 'postgresql');
        setPostgresDbList(postgresOnly);
      }
    };
    loadPostgresDbList();
  }, []);

  // 编辑进入填充内容
  useEffect(() => {
    if (type === 'edit') {
      const editData = JSON.parse(localStorage.getItem('edit_prompt_data') || '{}');
      setVariables(JSON.parse(editData.input_variables ?? '[]'));
      setValue(editData?.content);
      topForm.setFieldsValue({
        prompt_type: editData.prompt_type,
        prompt_name: editData.prompt_name,
        prompt_code: editData.prompt_code,
        target: editData.chat_scene,
      });
      bottomForm.setFieldsValue({
        model: editData.model,
        prompt_language: editData.prompt_language,
      });
    } else if (type === 'add') {
      // Set default values for new context creation - always use Scene and chat_with_db_execute
      topForm.setFieldsValue({
        prompt_type: 'Scene',
        target: 'chat_with_db_execute',
      });
      // Immediately load targets and template for Scene
      getTargets('Scene');
    }
  }, [bottomForm, topForm, type, getTargets]);

  return (
    <div
      className={`flex flex-col w-full h-full justify-between dark:bg-gradient-dark ${styles['prompt-operate-container']}`}
    >
      <header className='flex items-center justify-between px-6 py-2 h-14 border-b border-[#edeeef]'>
        <Space className='flex items-center'>
          <LeftOutlined
            className='text-base cursor-pointer hover:text-[#0c75fc]'
            onClick={() => {
              localStorage.removeItem('edit_prompt_data');
              router.replace('/construct/prompt');
            }}
          />
          <span className='font-medium text-sm'>{type === 'add' ? 'Add' : 'Edit'} Context</span>
        </Space>
        <Space>
          <Button type='primary' onClick={operateFn} loading={operateLoading}>
            {type === 'add' ? t('save') : t('update')}
          </Button>
        </Space>
      </header>
      <section className='flex h-full p-4 gap-4'>
        {/* 编辑展示区 */}
        <div className='flex flex-col flex-1 h-full overflow-y-auto pb-8 '>
          <MarkdownEditor
            value={value}
            onChange={onChange}
            renderHTML={text => mdParser.render(text)}
            view={{ html: false, md: true, menu: true }}
          />
          {/* llm 输出区域 */}
          {history.length > 0 && (
            <Card
              title={
                <Space>
                  <span>LLM OUT</span>
                  {errorMessage && <Alert message={errorMessage.msg} type={errorMessage.status} showIcon />}
                </Space>
              }
              className='mt-2'
            >
              <div className=' max-h-[400px] overflow-y-auto'>
                <MarkdownContext>{history?.[0]?.context.replace(/\\n/gm, '\n')}</MarkdownContext>
              </div>
            </Card>
          )}
        </div>
        {/* 功能区 */}
        <div className='flex flex-col w-2/5 pb-8 overflow-y-auto'>
          <Card className='mb-4'>
            <Form form={topForm}>
              {/* Hidden field for prompt_type - always set to Scene */}
              <Form.Item name='prompt_type' style={{ display: 'none' }}>
                <Input value='Scene' />
              </Form.Item>
              {/* Hidden field for target - always set to chat_with_db_execute */}
              <Form.Item name='target' style={{ display: 'none' }}>
                <Input value='chat_with_db_execute' />
              </Form.Item>
              {type === 'edit' && (
                <Form.Item label='Code' name='prompt_code'>
                  <Input disabled />
                </Form.Item>
              )}
              <Form.Item
                label='Name'
                name='prompt_name'
                className='m-0'
                rules={[{ required: true, message: t('Please_input_prompt_name') }]}
              >
                <Input placeholder={t('Please_input_prompt_name')} />
              </Form.Item>
            </Form>
          </Card>
          <Card title="Business Context Configuration" className='mb-4'>
            <Form form={midForm}>
              <Form.Item
                label="Select Database"
                name="db_name"
                rules={[{ required: true, message: 'Please select a database' }]}
              >
                <Select
                  placeholder="Choose your PostgreSQL database"
                  options={postgresDbList.map(db => ({
                    value: (db.params as any)?.database || db.id,
                    label: `${(db.params as any)?.database || 'Database'} (${(db.params as any)?.host || 'localhost'})`,
                  }))}
                />
              </Form.Item>

              <Form.Item
                label="Business Context Description"
                name="business_context"
                rules={[{ required: true, message: 'Please provide business context' }]}
              >
                <Input.TextArea
                  rows={6}
                  placeholder="Describe your business context here. Include:&#10;• Key Performance Indicators (KPIs) you want to track&#10;• Important business terms and definitions&#10;• Common questions you ask about your data&#10;• Preferred ways to visualize results&#10;&#10;Example: 'Our company tracks monthly recurring revenue (MRR), customer acquisition cost (CAC), and churn rate. We often analyze sales performance by region and want to see trends over time using line charts.'"
                />
              </Form.Item>

              {/* Hidden technical fields - auto-populated */}
              <Form.Item name="dialect" style={{ display: 'none' }}>
                <Input value="postgresql" />
              </Form.Item>
              <Form.Item name="display_type" style={{ display: 'none' }}>
                <Input value="Table,Line Chart,Bar Chart,Pie Chart" />
              </Form.Item>
              <Form.Item name="table_info" style={{ display: 'none' }}>
                <Input value="{table_info}" />
              </Form.Item>
              <Form.Item name="top_k" style={{ display: 'none' }}>
                <Input value="50" />
              </Form.Item>
              <Form.Item name="response" style={{ display: 'none' }}>
                <Input value='{"thoughts": "Business insights and explanation for the user", "sql": "SQL Query to analyze the data (hidden from user)", "display_type": "Best visualization method for the results"}' />
              </Form.Item>
              <Form.Item name="user_input" style={{ display: 'none' }}>
                <Input value="{user_input}" />
              </Form.Item>
            </Form>
          </Card>
          <Card title="Preview & Test" className='flex flex-col flex-1'>
            <div className='flex flex-col'>
              <Form
                form={bottomForm}
                initialValues={{
                  model: model,
                  temperature: 0.5,
                  prompt_language: 'en',
                }}
              >
                {/* Hide technical configuration, only show test input */}
                <Form.Item name='model' style={{ display: 'none' }}>
                  <Select options={modelOptions} />
                </Form.Item>
                <Form.Item name='temperature' style={{ display: 'none' }}>
                  <TemperatureItem />
                </Form.Item>
                <Form.Item name='prompt_language' style={{ display: 'none' }}>
                  <Select
                    options={[
                      {
                        label: 'English',
                        value: 'en',
                      },
                      {
                        label: 'Chinese',
                        value: 'zh',
                      },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="Ask a Question to Test" name='user_input'>
                  <Input.TextArea 
                    rows={3}
                    placeholder="Type a business question to test your context. For example: 'What was our revenue last month?' or 'Show me the top 10 customers by sales'"
                  />
                </Form.Item>
              </Form>
            </div>
            <Space className='flex justify-between'>
              <Button type='primary' onClick={onLLMTest} loading={llmLoading}>
                Test Context
              </Button>
              <Button
                type='primary'
                onClick={async () => {
                  if (verifyLoading || !history[0]?.context) {
                    return;
                  }
                  await run();
                }}
              >
                Validate Response
              </Button>
            </Space>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default AddOrEditPrompt;

export async function getStaticProps({ params }: { params: { type: string } }) {
  const { type } = params;
  // 根据动态路由参数 scene 获取所需的数据

  return {
    props: {
      type,
    },
  };
}

export async function getStaticPaths() {
  // 返回可能的动态路由参数为空，表示所有的页面都将在访问时生成
  return {
    paths: [{ params: { type: 'add' } }, { params: { type: 'edit' } }],
    fallback: 'blocking',
  };
}
