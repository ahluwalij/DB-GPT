import { EllipsisOutlined } from '@ant-design/icons';
import { Divider, DropDownProps, Dropdown, Tooltip, Typography } from 'antd';
import cls from 'classnames';
import { t } from 'i18next';
import Image from 'next/image';
import React from 'react';

import AppDefaultIcon from '../AppDefaultIcon';
import './style.css';

const BlurredCard: React.FC<{
  RightTop?: React.ReactNode;
  Tags?: React.ReactNode;
  LeftBottom?: React.ReactNode;
  RightBottom?: React.ReactNode;
  rightTopHover?: boolean;
  name: string;
  description: string | React.ReactNode;
  logo?: string;
  onClick?: () => void;
  className?: string;
  scene?: string;
  code?: string;
}> = ({
  RightTop,
  Tags,
  LeftBottom,
  RightBottom,
  onClick,
  rightTopHover = true,
  logo,
  name,
  description,
  className,
  scene,
  code,
}) => {
  if (typeof description === 'string') {
    description = (
      <p className='line-clamp-2 relative bottom-4 text-ellipsis min-h-[42px] text-sm text-[#525964] dark:text-[rgba(255,255,255,0.65)]'>
        {description}
      </p>
    );
  }

  return (
    <div className={cls('hover-underline-gradient flex justify-center mt-6 relative group w-1/3 px-2 mb-6', className)}>
      <div
        onClick={onClick}
        className='backdrop-filter backdrop-blur-lg cursor-pointer  bg-white bg-opacity-70 border-2 border-white rounded-lg shadow p-4 relative w-full h-full dark:border-[#6f7f95] dark:bg-[#6f7f95] dark:bg-opacity-60'
      >
        <div className='flex items-end relative bottom-8 justify-between w-full'>
          <div className='flex items-end gap-4 w-11/12  flex-1'>
            <div className='bg-white rounded-lg shadow-sm w-14 h-14 flex items-center p-3'>
              {scene ? (
                <AppDefaultIcon scene={scene} width={14} height={14} />
              ) : (
                logo && (
                  <Image src={logo} width={44} height={44} alt={name} className='w-8 min-w-8 rounded-full max-w-none' />
                )
              )}
            </div>
            <div className='flex-1'>
              {/** 先简单判断下 */}
              {name.length > 6 ? (
                <Tooltip title={name}>
                  <span
                    className='line-clamp-1 text-ellipsis font-semibold text-base'
                    style={{
                      maxWidth: '60%',
                    }}
                  >
                    {name}
                  </span>
                </Tooltip>
              ) : (
                <span
                  className='line-clamp-1 text-ellipsis font-semibold text-base'
                  style={{
                    maxWidth: '60%',
                  }}
                >
                  {name}
                </span>
              )}
            </div>
          </div>
          <span
            className={cls('shrink-0', {
              hidden: rightTopHover,
              'group-hover:block': rightTopHover,
            })}
            onClick={e => {
              e.stopPropagation();
            }}
          >
            {RightTop}
          </span>
        </div>
        {description}
        <div className='relative bottom-2'>{Tags}</div>
        <div className='flex justify-between items-center'>
          <div>{LeftBottom}</div>
          <div>{RightBottom}</div>
        </div>
        {code && (
          <>
            <Divider className='my-3' />
            <Typography.Text copyable={true} className='absolute bottom-1 right-4 text-xs text-gray-500'>
              {code}
            </Typography.Text>
          </>
        )}
      </div>
    </div>
  );
};

const ChatButton: React.FC<{
  onClick?: () => void;
  Icon?: React.ReactNode | string;
  text?: string;
}> = ({ onClick, Icon, text = t('Start Chat') }) => {
  return (
    <button
      className='flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium transition-all duration-200 hover:shadow-sm'
      onClick={e => {
        e.stopPropagation();
        onClick && onClick();
      }}
    >
      <svg 
        className="w-4 h-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
        />
      </svg>
      <span>{text}</span>
    </button>
  );
};

const InnerDropdown: React.FC<{ menu: DropDownProps['menu'] }> = ({ menu }) => {
  return (
    <Dropdown
      menu={menu}
      getPopupContainer={node => node.parentNode as HTMLElement}
      placement='bottomRight'
      autoAdjustOverflow={false}
    >
      <EllipsisOutlined className='p-2 hover:bg-white hover:dark:bg-black rounded-md' />
    </Dropdown>
  );
};

export { ChatButton, InnerDropdown };
export default BlurredCard;
