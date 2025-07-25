import { getModelIcon } from '@/utils/constants';
import SafeImage from '@/components/common/SafeImage';
import React, { memo, useMemo } from 'react';

const ModelIcon: React.FC<{ width?: number; height?: number; model?: string }> = ({ width, height, model }) => {
  const iconSrc = useMemo(() => {
    return getModelIcon(model || 'huggingface');
  }, [model]);

  if (!model) return null;

  return (
    <SafeImage
      className='rounded-full border border-gray-200 object-contain bg-white inline-block'
      width={width || 24}
      height={height || 24}
      src={iconSrc}
      alt='llm'
    />
  );
};

export default memo(ModelIcon);
