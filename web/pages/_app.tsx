import { ChatContext, ChatContextProvider } from '@/app/chat-context';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { SidebarRefreshProvider } from "@/components/layouts/sidebar-refresh-context";
import { NotificationProvider } from '@/components/providers/NotificationProvider';
import { STORAGE_USERINFO_KEY, STORAGE_USERINFO_VALID_TIME_KEY } from '@/utils/constants/index';
import { App, ConfigProvider, MappingAlgorithm, theme } from 'antd';
import enUS from 'antd/locale/en_US';
import classNames from 'classnames';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../app/i18n';
import '../nprogress.css';
import '../styles/globals.css';
import '../styles/auth.css';
import { customAuthClient } from '../lib/auth/client-custom';
import { Toaster } from 'sonner';
// import TopProgressBar from '@/components/layout/top-progress-bar';

const antdDarkTheme: MappingAlgorithm = (seedToken, mapToken) => {
  return {
    ...theme.darkAlgorithm(seedToken, mapToken),
    colorBgBase: '#232734',
    colorBorder: '#828282',
    colorBgContainer: '#232734',
  };
};

function CssWrapper({ children }: { children: React.ReactElement }) {
  const { mode } = useContext(ChatContext);
  const { i18n } = useTranslation();

  useEffect(() => {
    if (mode) {
      document.body?.classList?.add(mode);
      if (mode === 'light') {
        document.body?.classList?.remove('dark');
      } else {
        document.body?.classList?.remove('light');
      }
    }
  }, [mode]);

  useEffect(() => {
    i18n.changeLanguage?.('en');
  }, [i18n]);

  return (
    <div>
      {/* <TopProgressBar /> */}
      {children}
    </div>
  );
}

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isMenuExpand, mode } = useContext(ChatContext);
  const { i18n } = useTranslation();
  const [isLogin, setIsLogin] = useState(false);

  const router = useRouter();

  // Login check
  const handleAuth = async () => {
    console.log('handleAuth: Starting auth check');
    setIsLogin(false);
    
    try {
      // Check if user is authenticated with custom auth
      const session = await customAuthClient.getSession();
      console.log('handleAuth: Session result:', session);
      
      if (session?.user) {
        console.log('handleAuth: User authenticated:', session.user);
        // User is authenticated, store user info in localStorage for compatibility
        const user = {
          user_channel: `dbgpt`,
          user_no: session.user.id,
          nick_name: session.user.name,
          email: session.user.email,
        };
        localStorage.setItem(STORAGE_USERINFO_KEY, JSON.stringify(user));
        localStorage.setItem(STORAGE_USERINFO_VALID_TIME_KEY, Date.now().toString());
        setIsLogin(true);
      } else {
        console.log('handleAuth: No session, redirecting to sign-in');
        // No session, redirect to sign-in
        if (!router.pathname.startsWith('/auth/')) {
          router.push('/auth/sign-in');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Fallback - redirect to sign-in
      if (!router.pathname.startsWith('/auth/')) {
        router.push('/auth/sign-in');
      }
    }
  };

  useEffect(() => {
    handleAuth();
  }, []);

  if (!isLogin && !router.pathname.startsWith('/auth/')) {
    return null;
  }

  const renderContent = () => {
    if (router.pathname.includes('mobile')) {
      return <>{children}</>;
    }
    
    // Auth pages don't need sidebar
    if (router.pathname.startsWith('/auth/')) {
      return <>{children}</>;
    }
    
    return (
      <SidebarRefreshProvider>
        <SidebarProvider defaultOpen={isMenuExpand}>
          <Head>
            <meta name='viewport' content='initial-scale=1.0, width=device-width, maximum-scale=1' />
          </Head>
          {router.pathname !== '/construct/app/extra' && <AppSidebar />}
          <SidebarInset className="flex flex-col h-screen">
            <div className="flex-1 flex flex-col min-h-0">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SidebarRefreshProvider>
    );
  };

  return (
    <ConfigProvider
      locale={enUS}
      theme={{
        token: {
          colorPrimary: '#6B7280',
          borderRadius: 4,
        },
        algorithm: mode === 'dark' ? antdDarkTheme : undefined,
      }}
    >
      <App>
        <NotificationProvider>
          {renderContent()}
          <Toaster position="top-right" />
        </NotificationProvider>
      </App>
    </ConfigProvider>
  );
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChatContextProvider>
      <CssWrapper>
        <LayoutWrapper>
          <Component {...pageProps} />
        </LayoutWrapper>
      </CssWrapper>
    </ChatContextProvider>
  );
}

export default MyApp;
