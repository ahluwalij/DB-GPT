import { addSpace, apiInterceptors } from '@/client/api';
import { IStorage, StepChangeParams } from '@/types/knowledge';
import { Button, Form, Input, Select, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type FieldType = {
  spaceName: string;
  owner: string;
  description: string;
  storage: string;
  field: string;
};

type IProps = {
  handleStepChange: (params: StepChangeParams) => void;
  spaceConfig: IStorage | null;
};

export default function SpaceForm(props: IProps) {
  const { t } = useTranslation();
  const { handleStepChange, spaceConfig } = props;
  const [spinning, setSpinning] = useState<boolean>(false);
  const [storage, setStorage] = useState<string>();

  const [form] = Form.useForm();

  useEffect(() => {
    // Filter out KnowledgeGraph and get the first available storage
    const availableStorages = spaceConfig?.filter((item: any) => item.name !== 'KnowledgeGraph');
    const firstStorage = availableStorages?.[0];
    
    if (firstStorage) {
      form.setFieldValue('storage', firstStorage.name);
      setStorage(firstStorage.name);
      
      // Set default domain type to 'Normal' if available
      if (firstStorage?.domain_types?.length > 0) {
        const normalDomain = firstStorage.domain_types.find((domain: any) => domain.name === 'Normal');
        if (normalDomain) {
          form.setFieldValue('field', 'Normal');
        } else {
          // If 'Normal' is not found, set the first available domain type
          form.setFieldValue('field', firstStorage.domain_types[0].name);
        }
      }
    }
  }, [spaceConfig]);

  const handleStorageChange = (data: string) => {
    setStorage(data);
    
    // Update domain type when storage changes
    const selectedStorage = spaceConfig?.find((item: any) => item.name === data);
    if (selectedStorage?.domain_types?.length > 0) {
      const normalDomain = selectedStorage.domain_types.find((domain: any) => domain.name === 'Normal');
      if (normalDomain) {
        form.setFieldValue('field', 'Normal');
      } else {
        // If 'Normal' is not found, set the first available domain type
        form.setFieldValue('field', selectedStorage.domain_types[0].name);
      }
    }
  };

  const handleFinish = async (fieldsValue: FieldType) => {
    const { spaceName, owner, description, storage, field } = fieldsValue;
    setSpinning(true);
    const vector_type = storage;
    const domain_type = field;
    const [_, data, res] = await apiInterceptors(
      addSpace({
        name: spaceName,
        vector_type: vector_type,
        owner,
        desc: description,
        domain_type: domain_type,
      }),
    );
    setSpinning(false);
    const is_financial = domain_type === 'FinancialReport';
    localStorage.setItem('cur_space_id', JSON.stringify(data));
    res?.success &&
      handleStepChange({
        label: 'forward',
        spaceName,
        pace: is_financial ? 2 : 1,
        docType: is_financial ? 'DOCUMENT' : '',
      });
  };

  return (
    <Spin spinning={spinning}>
      <Form
        form={form}
        size='large'
        className='mt-4'
        layout='vertical'
        name='basic'
        initialValues={{ remember: true }}
        autoComplete='off'
        onFinish={handleFinish}
      >
        <Form.Item<FieldType>
          label={t('Knowledge_Space_Name')}
          name='spaceName'
          rules={[
            { required: true, message: t('Space Descriptor') },
            () => ({
              validator(_, value) {
                if (/[^\u4e00-\u9fa50-9a-zA-Z_-]/.test(value)) {
                  return Promise.reject(new Error(t('the_name_can_only_contain')));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <Input className='h-12' placeholder={t('Space Descriptor')} />
        </Form.Item>
        <Form.Item<FieldType>
          label={t('Storage')}
          name='storage'
          rules={[{ required: true, message: t('Please_select_the_storage') }]}
        >
          <Select className='mb-5 h-12' placeholder={t('Please_select_the_storage')} onChange={handleStorageChange}>
            {spaceConfig
              ?.filter((item: any) => item.name !== 'KnowledgeGraph')
              ?.map((item: any) => {
                return (
                  <Select.Option key={item.name} value={item.name}>
                    {item.desc}
                  </Select.Option>
                );
              })}
          </Select>
        </Form.Item>
        <Form.Item<FieldType>
          label={t('Domain')}
          name='field'
          rules={[{ required: true, message: t('Domain') }]}
        >
          <Select className='mb-5 h-12' placeholder={t('Domain')}>
            {spaceConfig
              ?.filter((item: any) => item.name !== 'KnowledgeGraph')
              ?.find((item: any) => item.name === storage)
              ?.domain_types?.map((item: any) => {
                return (
                  <Select.Option key={item.name} value={item.name}>
                    {item.desc}
                  </Select.Option>
                );
              })}
          </Select>
        </Form.Item>
        <Form.Item<FieldType>
          label={t('Description')}
          name='description'
          rules={[{ required: true, message: t('Please_input_the_description') }]}
        >
          <Input className='h-12' placeholder={t('Please_input_the_description')} />
        </Form.Item>
        <Form.Item>
          <Button type='primary' htmlType='submit'>
            {t('Next')}
          </Button>
        </Form.Item>
      </Form>
    </Spin>
  );
}
