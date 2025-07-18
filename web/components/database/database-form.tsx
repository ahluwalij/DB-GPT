import { apiInterceptors, postDbAdd, postDbEdit, postDbTestConnect } from '@/client/api';
import { ConfigurableParams } from '@/types/common';
import { DBOption, DBType } from '@/types/db';
import { Button, Form, Input, Select, message } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConfigurableForm from '../common/configurable-form';

const { Option } = Select;
const FormItem = Form.Item;

interface DatabaseFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  dbTypeList: DBOption[];
  editValue?: string;
  choiceDBType?: DBType;
  getFromRenderData?: ConfigurableParams[];
  dbNames?: string[];
  description?: string; // Add description prop
}

function DatabaseForm({
  onCancel,
  onSuccess,
  dbTypeList,
  editValue,
  choiceDBType,
  getFromRenderData,
  dbNames = [],
  description = '', // Default value for description
}: DatabaseFormProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<DBType | undefined>(choiceDBType);
  const [params, setParams] = useState<Array<ConfigurableParams> | null>(getFromRenderData || null);
  
  // Preset PostgreSQL credentials
  const PRESET_POSTGRES_CONFIG = {
    host: 'aws-0-us-east-2.pooler.supabase.com',
    port: 5432,
    user: 'postgres.eyernxegjjcfrwrupbtg',
    password: 'QyZ3NfJdrTJs2T9V',
    database: 'postgres'
  };
  
  console.log('dbTypeList', dbTypeList);
  console.log('editValue', editValue);
  console.log('choiceDBType', choiceDBType);

  useEffect(() => {
    if (choiceDBType) {
      setSelectedType(choiceDBType);
    }
  }, [choiceDBType]);

  useEffect(() => {
    if (editValue && getFromRenderData) {
      setParams(getFromRenderData);
      // set description
      form.setFieldValue('description', description);
    }
  }, [editValue, getFromRenderData, description, form]);

  // Set preset values for PostgreSQL when type changes or component mounts
  useEffect(() => {
    if (selectedType === 'postgresql' && !editValue) {
      // Set preset values for PostgreSQL
      form.setFieldsValue({
        host: PRESET_POSTGRES_CONFIG.host,
        port: PRESET_POSTGRES_CONFIG.port,
        user: PRESET_POSTGRES_CONFIG.user,
        password: PRESET_POSTGRES_CONFIG.password,
        database: PRESET_POSTGRES_CONFIG.database,
      });
    }
  }, [selectedType, editValue, form]);

  const handleTypeChange = (value: DBType) => {
    setSelectedType(value);
    form.resetFields(['params']);

    const selectedDBType = dbTypeList.find(type => type.value === value);
    if (selectedDBType?.parameters) {
      setParams(selectedDBType.parameters);
    }
  };

  const handleSubmit = async (formValues: any) => {
    try {
      setLoading(true);

      console.log('dbNames:', dbNames);

      const { description, type, ...values } = formValues;

      // For PostgreSQL, merge with preset values
      let params = values;
      if (selectedType === 'postgresql' && !editValue) {
        params = {
          ...PRESET_POSTGRES_CONFIG,
          ...values, // Override with any user-provided values
        };
      }

      const data = {
        type: selectedType,
        params,
        description: description || '',
      };

      // If in edit mode, add id
      if (editValue) {
        data.id = editValue;
      }

      console.log('Form submitted:', data);

      const [testErr] = await apiInterceptors(postDbTestConnect(data));
      if (testErr) return;
      const [err] = await apiInterceptors((editValue ? postDbEdit : postDbAdd)(data));
      if (err) {
        message.error(err.message);
        return;
      }
      message.success(t(editValue ? 'update_success' : 'create_success'));
      onSuccess?.();
    } catch (error) {
      console.error('Failed to submit form:', error);
      message.error(t(editValue ? 'update_failed' : 'create_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout='vertical'
      onFinish={handleSubmit}
      initialValues={{
        type: selectedType,
      }}
    >
      <FormItem
        label={t('database_type')}
        name='type'
        rules={[{ required: true, message: t('please_select_database_type') }]}
      >
        <Select placeholder={t('select_database_type')} onChange={handleTypeChange} disabled={!!editValue}>
          {dbTypeList.map(type => (
            <Option key={type.value} value={type.value} disabled={type.disabled}>
              {type.label}
            </Option>
          ))}
        </Select>
      </FormItem>

      {selectedType === 'postgresql' && !editValue ? (
        // Simplified PostgreSQL form - only show password field
        <div className='space-y-4'>
          <FormItem 
            label="Password" 
            name="password"
            rules={[{ required: true, message: 'Please enter the password' }]}
            initialValue={PRESET_POSTGRES_CONFIG.password}
          >
            <Input.Password 
              autoComplete='new-password' 
              placeholder='Enter PostgreSQL password'
            />
          </FormItem>
          <div className='text-sm text-gray-600 bg-gray-50 p-3 rounded'>
            <p><strong>Connection Details:</strong></p>
            <p>Host: {PRESET_POSTGRES_CONFIG.host}</p>
            <p>Port: {PRESET_POSTGRES_CONFIG.port}</p>
            <p>User: {PRESET_POSTGRES_CONFIG.user}</p>
            <p>Database: {PRESET_POSTGRES_CONFIG.database}</p>
          </div>
        </div>
      ) : (
        params && <ConfigurableForm params={params} form={form} />
      )}

      <FormItem label={t('description')} name='description'>
        <Input.TextArea rows={2} placeholder={t('input_description')} />
      </FormItem>

      <div className='flex justify-end space-x-4 mt-6'>
        <Button onClick={onCancel}>{t('cancel')}</Button>
        <Button type='primary' htmlType='submit' loading={loading}>
          {t('submit')}
        </Button>
      </div>
    </Form>
  );
}

export default DatabaseForm;
