import { sendSpacePostRequest } from '@/utils/request';
import { useRequest } from 'ahooks';
import { ConfigProvider, FloatButton, Form, List, Popover, Select, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type SelectTableProps = {
  data: any;
  loading: boolean;
  submit: (prompt: any) => void;
  close: () => void;
};

const SelectTable: React.FC<SelectTableProps> = ({ data, loading, submit, close }) => {
  const { t } = useTranslation();
  const handleClick = (item: any) => () => {
    submit(item);
    close();
  };

  return (
    <div
      style={{
        maxHeight: 400,
        overflow: 'auto',
      }}
    >
      <List
        dataSource={data?.data}
        loading={loading}
        rowKey={(record: any) => record.prompt_name}
        renderItem={item => (
          <List.Item key={item.prompt_name} onClick={handleClick(item)}>
            <List.Item.Meta
              style={{ cursor: 'copy' }}
              title={item.prompt_name}
              description={`Context: ${item.chat_scene} | Type: ${item.sub_chat_scene}`}
            />
          </List.Item>
        )}
      />
    </div>
  );
};

type PromptBotProps = {
  submit: (prompt: any) => void;
  chat_scene?: string;
};

const PromptBot: React.FC<PromptBotProps> = ({ submit, chat_scene }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('common');

  const { data, loading, run } = useRequest(
    () => {
      const body: any = {};
      if (current !== 'common') {
        body.prompt_type = current;
      }
      if (chat_scene) {
        body.chat_scene = chat_scene;
      }
      return sendSpacePostRequest('/prompt/list', body);
    },
    {
      refreshDeps: [current, chat_scene],
      onError: err => {
        message.error(err?.message);
      },
      manual: true,
    },
  );

  useEffect(() => {
    if (open) {
      run();
    }
  }, [open, current, chat_scene, run]);

  const close = () => {
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  const handleChange = (value: string) => {
    setCurrent(value);
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Popover: {
            minWidth: 250,
          },
        },
      }}
    >
      <Popover
        title={
          <div>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>Select to Share Context</div>
            <Form.Item label="Context Type" style={{ marginBottom: 0 }}>
              <Select
                style={{ width: 150 }}
                value={current}
                onChange={handleChange}
                options={[
                  {
                    label: 'Public Contexts',
                    value: 'common',
                  },
                  {
                    label: 'Private Contexts',
                    value: 'private',
                  },
                ]}
              />
            </Form.Item>
          </div>
        }
        content={<SelectTable {...{ data, loading, submit, close }} />}
        placement='topRight'
        trigger='click'
        open={open}
        onOpenChange={handleOpenChange}
      >
        <FloatButton className='bottom-[30%]' />
      </Popover>
    </ConfigProvider>
  );
};

export default PromptBot;
