import { apiInterceptors, getFlowById } from '@/client/api';
import MuiLoading from '@/components/common/loading';
import AddNodesSider from '@/components/flow/add-nodes-sider';
import ButtonEdge from '@/components/flow/button-edge';
import {
  AddFlowVariableModal,
  ExportFlowModal,
  FlowTemplateModal,
  ImportFlowModal,
  SaveFlowModal,
} from '@/components/flow/canvas-modal';
import CanvasNode from '@/components/flow/canvas-node';
import { IFlowData, IFlowUpdateParam } from '@/types/flow';
import { checkFlowDataRequied, getUniqueNodeId, mapUnderlineToHump } from '@/utils/flow';
import { ExportOutlined, FileAddOutlined, FrownOutlined, ImportOutlined, SaveOutlined } from '@ant-design/icons';
import { Divider, Space, Tooltip, message, notification } from 'antd';
import { useSearchParams } from 'next/navigation';
import React, { DragEvent, useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Connection,
  Controls,
  Node,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

const nodeTypes = { customNode: CanvasNode };
const edgeTypes = { buttonedge: ButtonEdge };

const Canvas: React.FC = () => {
  const searchParams = useSearchParams();
  const id = searchParams?.get('id') || '';
  const reactFlow = useReactFlow();
  const [messageApi, contextHolder] = message.useMessage();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [flowInfo, setFlowInfo] = useState<IFlowUpdateParam>();
  const [loading, setLoading] = useState(false);
  const [isSaveFlowModalOpen, setIsSaveFlowModalOpen] = useState(false);
  const [isExportFlowModalOpen, setIsExportFlowModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportFlowModalOpen] = useState(false);
  const [isFlowTemplateModalOpen, setIsFlowTemplateModalOpen] = useState(false);

  if (localStorage.getItem('importFlowData')) {
    const importFlowData = JSON.parse(localStorage.getItem('importFlowData') || '{}');
    localStorage.removeItem('importFlowData');
    setLoading(true);
    const flowData = mapUnderlineToHump(importFlowData.flow_data);
    setFlowInfo(importFlowData);
    setNodes(flowData.nodes);
    setEdges(flowData.edges);
    setLoading(false);
  }

  async function getFlowData() {
    setLoading(true);
    const [_, data] = await apiInterceptors(getFlowById(id));
    if (data) {
      const flowData = mapUnderlineToHump(data.flow_data);
      setFlowInfo(data);
      setNodes(flowData.nodes);
      setEdges(flowData.edges);
    }
    setLoading(false);
  }

  useEffect(() => {
    id && getFlowData();
  }, [id]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.returnValue = message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  function onNodesClick(_: any, clickedNode: Node) {
    reactFlow.setNodes(nds =>
      nds.map(node => {
        if (node.id === clickedNode.id) {
          node.data = {
            ...node.data,
            selected: true,
          };
        } else {
          node.data = {
            ...node.data,
            selected: false,
          };
        }
        return node;
      }),
    );
  }

  function onConnect(connection: Connection) {
    const newEdge = {
      ...connection,
      type: 'buttonedge',
      id: `${connection.source}|${connection.target}`,
    };
    setEdges(eds => addEdge(newEdge, eds));
  }

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current!.getBoundingClientRect();
      const sidebarWidth = (document.getElementsByClassName('ant-layout-sider')?.[0] as HTMLElement)?.offsetWidth; // get sidebar width

      const nodeStr = event.dataTransfer.getData('application/reactflow');
      if (!nodeStr || typeof nodeStr === 'undefined') {
        return;
      }

      const nodeData = JSON.parse(nodeStr);
      const position = reactFlow.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left + sidebarWidth,
        y: event.clientY - reactFlowBounds.top,
      });
      const nodeId = getUniqueNodeId(nodeData, reactFlow.getNodes());
      nodeData.id = nodeId;
      const newNode = {
        id: nodeId,
        position,
        type: 'customNode',
        data: nodeData,
      };
      setNodes(nds =>
        nds.concat(newNode).map(node => {
          if (node.id === newNode.id) {
            node.data = {
              ...node.data,
              selected: true,
            };
          } else {
            node.data = {
              ...node.data,
              selected: false,
            };
          }
          return node;
        }),
      );
    },
    [reactFlow],
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  function onSave() {
    const flowData = reactFlow.toObject() as IFlowData;
    const [check, node, message] = checkFlowDataRequied(flowData);

    if (!node) {
      messageApi.open({
        type: 'warning',
        content: 'Please add nodes first',
      });
      return;
    }

    if (!check && message) {
      setNodes(nds =>
        nds.map(item => ({
          ...item,
          data: {
            ...item.data,
            invalid: item.id === node?.id,
          },
        })),
      );
      return notification.error({
        message: 'Error',
        description: message,
        icon: <FrownOutlined className='text-red-600' />,
      });
    }
    setIsSaveFlowModalOpen(true);
  }

  const getButtonList = () => {
    const buttonList = [
      {
        title: 'Template',
        icon: <FileAddOutlined className='block text-xl' onClick={() => setIsFlowTemplateModalOpen(true)} />,
      },
      {
        title: 'Import',
        icon: <ImportOutlined className='block text-xl' onClick={() => setIsImportFlowModalOpen(true)} />,
      },
      {
        title: 'Save',
        icon: <SaveOutlined className='block text-xl' onClick={onSave} />,
      },
    ];

    if (id !== '') {
      buttonList.unshift({
        title: 'Export',
        icon: <ExportOutlined className='block text-xl' onClick={() => setIsExportFlowModalOpen(true)} />,
      });
    }

    return buttonList;
  };

  return (
    <>
      <div className='flex flex-row'>
        <AddNodesSider />

        <div className='flex flex-col flex-1'>
          <Space className='my-2 mx-4 flex flex-row justify-end'>
            {getButtonList().map(({ title, icon }) => (
              <Tooltip
                key={title}
                title={title}
                className='w-8 h-8 rounded-md bg-stone-300 dark:bg-zinc-700 dark:text-zinc-200 hover:text-black-500 dark:hover:text-zinc-100'
              >
                {icon}
              </Tooltip>
            ))}
          </Space>

          <Divider className='mt-0 mb-0' />

          <div className='h-[calc(100vh-48px)] w-full' ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodesClick}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              minZoom={0.1}
              fitView
              deleteKeyCode={['Backspace', 'Delete']}
            >
              <Controls className='flex flex-row items-center' position='bottom-center' />

              <Background color='#aaa' gap={16} />

              <AddFlowVariableModal flowInfo={flowInfo} setFlowInfo={setFlowInfo} />
            </ReactFlow>
          </div>
        </div>
      </div>

      <MuiLoading visible={loading} />

      <SaveFlowModal
        reactFlow={reactFlow}
        flowInfo={flowInfo}
        isSaveFlowModalOpen={isSaveFlowModalOpen}
        setIsSaveFlowModalOpen={setIsSaveFlowModalOpen}
      />

      <ExportFlowModal
        reactFlow={reactFlow}
        flowInfo={flowInfo}
        isExportFlowModalOpen={isExportFlowModalOpen}
        setIsExportFlowModalOpen={setIsExportFlowModalOpen}
      />

      <ImportFlowModal
        setNodes={setNodes}
        setEdges={setEdges}
        isImportModalOpen={isImportModalOpen}
        setIsImportFlowModalOpen={setIsImportFlowModalOpen}
      />

      <FlowTemplateModal
        isFlowTemplateModalOpen={isFlowTemplateModalOpen}
        setIsFlowTemplateModalOpen={setIsFlowTemplateModalOpen}
      />

      {contextHolder}
    </>
  );
};

export default function CanvasWrapper() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}
