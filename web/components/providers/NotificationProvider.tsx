import React, { useEffect, useContext } from 'react';
import { App } from 'antd';
import { notificationService } from '@/utils/notification';
import { Toaster } from 'sonner';
import { ChatContext } from '@/app/chat-context';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { notification } = App.useApp();
  const { mode } = useContext(ChatContext);

  useEffect(() => {
    // Initialize the notification service with the App context
    notificationService.setNotificationApi(notification);
  }, [notification]);

  return (
    <>
      {children}
      <Toaster 
        theme={mode === 'dark' ? 'dark' : 'light'}
        richColors
        position="top-right"
      />
    </>
  );
};