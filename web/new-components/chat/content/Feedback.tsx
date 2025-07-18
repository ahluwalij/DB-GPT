import { apiInterceptors, cancelFeedback, feedbackAdd, getFeedbackReasons } from '@/client/api';
import { useRequest } from 'ahooks';
import { Divider, Input, Popover, Tag, message } from 'antd';
import { Button } from '@/components/ui/button';
import { Copy, ThumbsDown, ThumbsUp } from 'lucide-react';
import classNames from 'classnames';
import copy from 'copy-to-clipboard';
import { useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Tags {
  reason: string;
  reason_type: string;
}

const DislikeContent: React.FC<{
  list: Tags[];
  loading: boolean;
  feedback: (params: {
    feedback_type: string;
    reason_types?: string[] | undefined;
    remark?: string | undefined;
  }) => void;
  setFeedbackOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ list, loading, feedback, setFeedbackOpen }) => {
  const { t } = useTranslation();
  const [selectedTags, setSelectedTags] = useState<Tags[]>([]);
  const [remark, setRemark] = useState('');

  return (
    <div className='flex flex-col'>
      <div className='flex flex-1 flex-wrap w-72'>
        {list?.map(item => {
          const isSelect = selectedTags.findIndex(tag => tag.reason_type === item.reason_type) > -1;
          return (
            <Tag
              key={item.reason_type}
              className={`text-xs text-[#525964] mb-2 p-1 px-2 rounded-md cursor-pointer ${isSelect ? 'border-[#6B7280] text-[#6B7280]' : ''}`}
              onClick={() => {
                setSelectedTags((preArr: Tags[]) => {
                  const index = preArr.findIndex(tag => tag.reason_type === item.reason_type);
                  if (index > -1) {
                    return [...preArr.slice(0, index), ...preArr.slice(index + 1)];
                  }
                  return [...preArr, item];
                });
              }}
            >
              {item.reason}
            </Tag>
          );
        })}
      </div>
      <Input.TextArea
        placeholder={t('Feedback')}
        className='w-64 h-20 resize-none mb-2'
        value={remark}
        onChange={e => setRemark(e.target.value.trim())}
      />
      <div className='flex gap-2 justify-end'>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFeedbackOpen(false);
          }}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={async () => {
            const reason_types = selectedTags.map(item => item.reason_type);
            await feedback?.({
              feedback_type: 'unlike',
              reason_types,
              remark,
            });
          }}
          disabled={loading}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
};

const Feedback: React.FC<{ content: Record<string, any> }> = ({ content }) => {
  const { t } = useTranslation();

  const searchParams = useSearchParams();
  const chatId = searchParams?.get('id') ?? '';

  const [messageApi, contextHolder] = message.useMessage();
  const [feedbackOpen, setFeedbackOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<'like' | 'unlike' | 'none'>(content?.feedback?.feedback_type);
  const [list, setList] = useState<Tags[]>();

  // 复制回答
  const onCopyContext = async (context: any) => {
    const pureStr = context?.replace(/\trelations:.*/g, '');
    const result = copy(pureStr);
    if (result) {
      if (pureStr) {
        messageApi.open({ type: 'success', content: t('copy_success') });
      } else {
        messageApi.open({ type: 'warning', content: t('copy_nothing') });
      }
    } else {
      messageApi.open({ type: 'error', content: t('copy_failed') });
    }
  };

  // 点赞/踩
  const { run: feedback, loading } = useRequest(
    async (params: { feedback_type: string; reason_types?: string[]; remark?: string }) =>
      await apiInterceptors(
        feedbackAdd({
          conv_uid: chatId,
          message_id: content.order + '',
          feedback_type: params.feedback_type,
          reason_types: params.reason_types,
          remark: params.remark,
        }),
      ),
    {
      manual: true,
      onSuccess: data => {
        const [, res] = data;
        setStatus(res?.feedback_type);
        message.success(t('Feedback Success'));
        setFeedbackOpen(false);
      },
    },
  );

  // 反馈原因类型
  const { run: getReasonList } = useRequest(async () => await apiInterceptors(getFeedbackReasons()), {
    manual: true,
    onSuccess: data => {
      const [, res] = data;
      setList(res || []);
      if (res) {
        setFeedbackOpen(true);
      }
    },
  });

  // 取消反馈
  const { run: cancel } = useRequest(
    async () => await apiInterceptors(cancelFeedback({ conv_uid: chatId, message_id: content?.order + '' })),
    {
      manual: true,
      onSuccess: data => {
        const [, res] = data;
        if (res) {
          setStatus('none');
          message.success(t('Success'));
        }
      },
    },
  );

  return (
    <>
      {contextHolder}
      <div className='flex w-full opacity-0 group-hover/message:opacity-100 transition-opacity duration-300'>
        <Button
          variant="ghost"
          size="sm"
          className={classNames('size-3! p-4! hover:bg-gray-100', { 'text-[#6B7280]': status === 'like' })}
          onClick={async () => {
            if (status === 'like') {
              await cancel();
              return;
            }
            await feedback({ feedback_type: 'like' });
          }}
        >
          <ThumbsUp className="h-4 w-4" />
        </Button>
        <Popover
          placement='bottom'
          autoAdjustOverflow
          destroyTooltipOnHide={true}
          content={
            <DislikeContent
              setFeedbackOpen={setFeedbackOpen}
              feedback={feedback}
              list={list || []}
              loading={loading}
            />
          }
          trigger='click'
          open={feedbackOpen}
        >
          <Button
            variant="ghost"
            size="sm"
            className={classNames('size-3! p-4! hover:bg-gray-100', {
              'text-[#6B7280]': status === 'unlike',
            })}
            onClick={async () => {
              if (status === 'unlike') {
                await cancel();
                return;
              }
              await getReasonList();
            }}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </Popover>
        <Button
          variant="ghost"
          size="sm"
          className='size-3! p-4! hover:bg-gray-100'
          onClick={() => onCopyContext(content.context)}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
};

export default Feedback;
