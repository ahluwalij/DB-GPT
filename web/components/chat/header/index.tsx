import { ChatContext } from '@/app/chat-context';
import ModelSelector from '@/components/chat/header/model-selector';
import ModeTab from '@/components/chat/mode-tab';
import { useContext } from 'react';
import AgentSelector from './agent-selector';
import ChatExcel from './chat-excel';
import ModernDBSelector from './modern-db-selector';

/**
 * chat header
 */
interface Props {
  refreshHistory?: () => Promise<void>;
  modelChange?: (val: string) => void;
}

function Header({ refreshHistory, modelChange }: Props) {
  const { scene, refreshDialogList } = useContext(ChatContext);

  return (
    <div className='w-full py-2 px-4 md:px-4 flex flex-wrap items-center justify-center gap-1 md:gap-4'>
      {/* Models Selector */}
      <ModelSelector onChange={modelChange} />
      {/* DB Selector */}
      <ModernDBSelector />
      {/* Excel Upload */}
      {/* Commented out to hide chat excel functionality
      {scene === 'chat_excel' && (
        <ChatExcel
          onComplete={() => {
            refreshDialogList?.();
            refreshHistory?.();
          }}
        />
      )}
      */}
      {/* Agent Selector */}
      {scene === 'chat_agent' && <AgentSelector />}
      <ModeTab />
    </div>
  );
}

export default Header;
