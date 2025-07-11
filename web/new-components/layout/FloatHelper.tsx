import { ReadOutlined, SmileOutlined } from '@ant-design/icons';
import { FloatButton } from 'antd';
import React from 'react';

const FloatHelper: React.FC = () => {
  return (
    <FloatButton.Group trigger='hover' icon={<SmileOutlined />}>
      <FloatButton icon={<ReadOutlined />} href='https://www.universalagi.com/' target='_blank' tooltip='Documents' />
    </FloatButton.Group>
  );
};
export default FloatHelper;
