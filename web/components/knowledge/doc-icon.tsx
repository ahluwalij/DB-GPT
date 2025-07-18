import { FileTextFilled, FileWordFilled, IeCircleFilled, YuqueFilled } from '@ant-design/icons';

export default function DocIcon({ type }: { type: string }) {
  if (type === 'TEXT') {
    return <FileTextFilled className='text-gray-200 mr-2 !text-lg' />;
  } else if (type === 'DOCUMENT') {
    return <FileWordFilled className='text-gray-200 mr-2 !text-lg' />;
  } else if (type === 'YUQUEURL') {
    return <YuqueFilled className='text-gray-200 mr-2 !text-lg' />;
  } else {
    return <IeCircleFilled className='text-gray-200 mr-2 !text-lg' />;
  }
}
