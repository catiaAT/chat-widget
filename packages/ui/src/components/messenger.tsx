import { FunctionalComponent, h } from '@stencil/core';

import { configStore } from '../store/config-store';

type MessengerProps = {
  isOpen: boolean;
  isFullScreen: boolean;
  toggleFullScreenMode: () => void;
  hasFeedback?: boolean;
  restartEnabled?: boolean;
  onRestart?: (e: MouseEvent) => void;
};

export const Messenger: FunctionalComponent<MessengerProps> = ({ isOpen, isFullScreen, toggleFullScreenMode, hasFeedback, restartEnabled, onRestart }, children) => {
  const Icon = isFullScreen ? 'rasa-icon-arrows-contract' : 'rasa-icon-arrows-expand';

  return (
    <div class={{ 
      'messenger': true, 
      'messenger--fullscreen': isFullScreen, 
      'messenger--open': isOpen,
      'messenger--with-feedback': hasFeedback
    }}>
      <div class="messenger__header">
        <div style={{ flexGrow: '1' }}>
          <rasa-text value={configStore().widgetTitle} disableParsing></rasa-text>
        </div>
        {restartEnabled && (
          <div onClick={onRestart} class="messenger__header__icon" title="Reiniciar Conversa" style={{ display: 'flex', alignItems: 'center', marginRight: '10px', cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </div>
        )}
        {configStore().toggleFullScreen && <Icon onClick={toggleFullScreenMode} class="messenger__header__icon" size={20}></Icon>}
      </div>
      <div class="messenger__content-wrapper">
        <div class="messenger__content">{children}</div>
      </div>
      <error-toast></error-toast>
      <rasa-chat-input></rasa-chat-input>
    </div>
  );
};
