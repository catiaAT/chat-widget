import { createStore } from '@stencil/store';
import { v4 as uuidv4 } from 'uuid';

type WidgetState = {
  connected: boolean;
  historyLoaded: boolean;
  activeQuickReply: string;
  userInputDisabled: boolean;
};

const { state, onChange } = createStore<WidgetState>({
  connected: false,
  historyLoaded: false,
  activeQuickReply: uuidv4(),
  userInputDisabled: false,
});

export const widgetState = {
  isConnected: () => state.connected,
  isHistoryLoaded: () => state.historyLoaded,
  activeQuickReply: () => state.activeQuickReply,
  isUserInputDisabled: () => state.userInputDisabled,
  getState: () => ({ state, onChange })
};
