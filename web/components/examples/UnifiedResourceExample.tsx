import React, { useState } from 'react';
import Resource from '@/new-components/chat/input/Resource';
import type { UploadFile } from 'antd';

/**
 * Example component showing how to use the unified resource selector
 * that displays both databases and knowledge spaces in a single popover
 */
const UnifiedResourceExample: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Unified Resource Selector Example</h2>
      
      {/* Use the Resource component with showAllResources prop */}
      <Resource
        fileList={fileList}
        setFileList={setFileList}
        setLoading={setLoading}
        fileName=""
        showAllResources={true} // This enables the unified view
      />
      
      <div className="mt-4 text-sm text-gray-600">
        <p>This example shows how to use the Resource component to display both databases and knowledge spaces in a single popover.</p>
        <p className="mt-2">Key features:</p>
        <ul className="list-disc list-inside mt-1">
          <li>Shows databases and knowledge spaces in categorized sections</li>
          <li>Uses the new `/api/v1/chat/resources/all` endpoint</li>
          <li>Maintains consistent UI with radio button selection</li>
          <li>Supports "None" option to clear selection</li>
        </ul>
      </div>
    </div>
  );
};

export default UnifiedResourceExample;