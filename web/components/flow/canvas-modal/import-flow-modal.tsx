import { apiInterceptors, importFlow } from '@/client/api';
import CanvasWrapper from '@/pages/construct/flow/canvas/index';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Form, GetProp, Modal, Radio, Upload, UploadFile, UploadProps, message } from 'antd';
import { useEffect, useState } from 'react';
import { Edge, Node } from 'reactflow';

type Props = {
  isImportModalOpen: boolean;
  setNodes: React.Dispatch<React.SetStateAction<Node<any, string | undefined>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge<any>[]>>;
  setIsImportFlowModalOpen: (value: boolean) => void;
};
type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

export const ImportFlowModal: React.FC<Props> = ({ isImportModalOpen, setIsImportFlowModalOpen }) => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    if (isImportModalOpen) {
      form.resetFields();
      setFileList([]);
    }
  }, [isImportModalOpen, form]);

  const onFlowImport = async (values: any) => {
    values.file = values.file?.[0];

    const formData: any = new FormData();
    fileList.forEach(file => {
      formData.append('file', file as FileType);
      formData.append('save_flow', values.save_flow);
    });
    const [, , res] = await apiInterceptors(importFlow(formData));

    if (res?.success) {
      messageApi.success('Flow imported successfully');
      localStorage.setItem('importFlowData', JSON.stringify(res?.data));
      CanvasWrapper();
    } else if (res?.err_msg) {
      messageApi.error(res?.err_msg);
    }
    setIsImportFlowModalOpen(false);
  };

  const props: UploadProps = {
    onRemove: (file: any) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file: any) => {
      setFileList([...fileList, file]);
      return false;
    },
    fileList,
  };

  return (
    <>
      <Modal
        title='Import Flow'
        open={isImportModalOpen}
        onCancel={() => setIsImportFlowModalOpen(false)}
        footer={[
          <Button key='cancel' onClick={() => setIsImportFlowModalOpen(false)}>
            Cancel
          </Button>,
          <Button key='submit' type='primary' onClick={() => form.submit()}>
            Import
          </Button>,
        ]}
      >
        <Form
          form={form}
          className='mt-6'
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
          onFinish={onFlowImport}
          initialValues={{
            save_flow: false,
          }}
        >
          <Form.Item
            name='file'
            label='Select File'
            valuePropName='fileList'
            getValueFromEvent={e => (Array.isArray(e) ? e : e && e.fileList)}
            rules={[{ required: true, message: 'Please upload a file' }]}
          >
            <Upload {...props} accept='.json,.zip' maxCount={1}>
              <Button icon={<UploadOutlined />}>Upload</Button>
            </Upload>
          </Form.Item>

          <Form.Item name='save_flow' label='Save After Import' hidden>
            <Radio.Group>
              <Radio value={true}>Yes</Radio>
              <Radio value={false}>No</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>

      {contextHolder}
    </>
  );
};
