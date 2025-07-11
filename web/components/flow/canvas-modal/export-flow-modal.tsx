import { IFlowData, IFlowUpdateParam } from '@/types/flow';
import { Button, Form, Input, Modal, Radio, message } from 'antd';
import { ReactFlowInstance } from 'reactflow';

type Props = {
  reactFlow: ReactFlowInstance<any, any>;
  flowInfo?: IFlowUpdateParam;
  isExportFlowModalOpen: boolean;
  setIsExportFlowModalOpen: (value: boolean) => void;
};

export const ExportFlowModal: React.FC<Props> = ({
  reactFlow,
  flowInfo,
  isExportFlowModalOpen,
  setIsExportFlowModalOpen,
}) => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const onFlowExport = async (values: any) => {
    if (values.format === 'json') {
      const flowData = reactFlow.toObject() as IFlowData;
      const blob = new Blob([JSON.stringify(flowData)], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = values.file_name || 'flow.json';
      a.click();
    } else {
      const linkUrl = `${process.env.API_BASE_URL ?? ''}/api/v2/serve/awel/flow/export/${values.uid}?export_type=${values.export_type}&format=${values.format}`;
      window.open(linkUrl);
    }
    messageApi.success('Flow exported successfully');

    setIsExportFlowModalOpen(false);
  };

  return (
    <>
      <Modal
        title='Export Flow'
        open={isExportFlowModalOpen}
        onCancel={() => setIsExportFlowModalOpen(false)}
        footer={[
          <Button key='cancel' onClick={() => setIsExportFlowModalOpen(false)}>
            Cancel
          </Button>,
          <Button key='submit' type='primary' onClick={() => form.submit()}>
            Export
          </Button>,
        ]}
      >
        <Form
          form={form}
          className='mt-6'
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
          onFinish={onFlowExport}
          initialValues={{
            export_type: 'json',
            format: 'file',
            uid: flowInfo?.uid,
          }}
        >
          <Form.Item label='Export File Type' name='export_type'>
            <Radio.Group>
              <Radio value='json'>JSON</Radio>
              <Radio value='dbgpts'>DBGPTS</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item label='Export File Format' name='format'>
            <Radio.Group>
              <Radio value='file'>File</Radio>
              <Radio value='json'>JSON</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item hidden name='uid'>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {contextHolder}
    </>
  );
};
