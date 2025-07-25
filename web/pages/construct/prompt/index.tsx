import { apiInterceptors, deletePrompt, getPromptList } from '@/client/api';
import useUser from '@/hooks/use-user';
import ConstructLayout from '@/new-components/layout/Construct';
import { IPrompt, PromptListResponse } from '@/types/prompt';
import { PlusOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { App, Button, Popconfirm, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { TFunction } from 'i18next';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.css';

const LangMap = { zh: 'Chinese', en: 'English' };

const DeleteBtn: React.FC<{ record: IPrompt; refresh: () => void }> = ({ record, refresh }) => {
  const userInfo = useUser();
  const { t } = useTranslation();

  const { message } = App.useApp();

  // Delete prompt
  const { run: deletePromptRun, loading: deleteLoading } = useRequest(
    async record => {
      await deletePrompt({
        ...record,
      });
    },
    {
      manual: true,
      onSuccess: async () => {
        message.success('Delete successful');
        await refresh();
      },
    },
  );

  if (userInfo?.user_id !== record?.user_id) {
    return null;
  }

  return (
    <Popconfirm title='Are you sure you want to delete?' onConfirm={async () => await deletePromptRun(record)}>
      <Button loading={deleteLoading}>Delete</Button>
    </Popconfirm>
  );
};

const Prompt = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const [promptList, setPromptList] = useState<PromptListResponse>();

  const {
    run: getPrompts,
    loading,
    refresh,
  } = useRequest(
    async (page = 1, page_size = 6) => {
      const [_, data] = await apiInterceptors(
        getPromptList({
          page,
          page_size,
        }),
      );
      return data;
    },
    {
      manual: true,
      onSuccess: data => {
        setPromptList(data!);
      },
    },
  );

  const handleEditBtn = (prompt: IPrompt) => {
    localStorage.setItem('edit_prompt_data', JSON.stringify(prompt));
    router.push('/construct/prompt/edit');
  };

  const handleAddBtn = () => {
    router.push('/construct/prompt/add');
  };

  const getColumns = (t: TFunction, handleEdit: (prompt: IPrompt) => void): ColumnsType<IPrompt> => [
    {
      title: 'Name',
      dataIndex: 'prompt_name',
      key: 'prompt_name',
      width: '10%',
    },
    {
      title: 'Scene',
      dataIndex: 'chat_scene',
      key: 'chat_scene',
      width: '10%',
    },
    {
      title: 'Language',
      dataIndex: 'prompt_language',
      key: 'prompt_language',
      render: lang => (lang ? LangMap[lang as keyof typeof LangMap] : '-'),
      width: '10%',
    },
    {
      title: 'Content',
      dataIndex: 'content',
      key: 'content',
      render: content => <Typography.Paragraph ellipsis={{ rows: 2, tooltip: true }}>{content}</Typography.Paragraph>,
    },
    {
      title: 'Operation',
      dataIndex: 'operate',
      key: 'operate',
      render: (_, record) => (
        <Space align='center'>
          <Button
            onClick={() => {
              handleEdit(record);
            }}
            type='primary'
          >
            Edit
          </Button>
          <DeleteBtn record={record} refresh={refresh} />
        </Space>
      ),
    },
  ];

  useEffect(() => {
    getPrompts();
  }, [getPrompts]);

  return (
    <ConstructLayout>
      <div className={`px-6 py-2 ${styles['prompt-container']} md:p-6 h-[90vh] overflow-y-auto`}>
        <div className='flex justify-end items-center mb-6'>
          <Button
            className='border-none text-white bg-button-gradient h-10'
            onClick={handleAddBtn}
            icon={<PlusOutlined />}
          >
            Add Context
          </Button>
        </div>
        <Table
          columns={getColumns(t, handleEditBtn)}
          dataSource={promptList?.items || []}
          loading={loading}
          rowKey={record => record.prompt_name}
          pagination={{
            pageSize: 6,
            total: promptList?.total_count,
            onChange: async (page, page_size) => {
              await getPrompts(page, page_size);
            },
          }}
        />
      </div>
    </ConstructLayout>
  );
};

export default Prompt;
