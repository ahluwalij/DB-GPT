import { getFlowTemplates } from '@/client/api';
import CanvasWrapper from '@/pages/construct/flow/canvas/index';
import type { TableProps } from 'antd';
import { Button, Modal, Space, Table } from 'antd';
import { useEffect, useState } from 'react';

type Props = {
  isFlowTemplateModalOpen: boolean;
  setIsFlowTemplateModalOpen: (value: boolean) => void;
};

interface DataType {
  key: string;
  name: string;
  age: number;
  address: string;
  tags: string[];
}

export const FlowTemplateModal: React.FC<Props> = ({ isFlowTemplateModalOpen, setIsFlowTemplateModalOpen }) => {
  const [dataSource, setDataSource] = useState([]);

  const onTemplateImport = (record: DataType) => {
    if (record?.name) {
      localStorage.setItem('importFlowData', JSON.stringify(record));
      CanvasWrapper();
      setIsFlowTemplateModalOpen(false);
    }
  };

  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'Template Name',
      dataIndex: 'name',
      key: 'name',
      width: '30%',
    },
    {
      title: 'Template Label',
      dataIndex: 'label',
      key: 'label',
      width: '30%',
    },
    {
      title: 'Template Description',
      dataIndex: 'description',
      key: 'description',
      width: '30%',
    },
    {
      title: 'Action',
      key: 'action',
      width: '10%',
      render: (_, record) => (
        <Space size='middle'>
          <Button
            type='link'
            onClick={() => {
              onTemplateImport(record);
            }}
            block
          >
            Import
          </Button>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    getFlowTemplates().then(res => {
      console.log(res);
      setDataSource(res?.data?.data?.items);
    });
  }, []);

  return (
    <>
      <Modal
        className='w-[900px]'
        title='Import From Template'
        open={isFlowTemplateModalOpen}
        onCancel={() => setIsFlowTemplateModalOpen(false)}
        cancelButtonProps={{ className: 'hidden' }}
        okButtonProps={{ className: 'hidden' }}
      >
        <Table
          className='w-full'
          // scroll={{ x: 'max-content' }}
          dataSource={dataSource}
          columns={columns}
        />
      </Modal>
    </>
  );
};
