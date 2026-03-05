import { EventEmitter } from './EventEmitter';
import { HTTPConnection } from './connection-strategy/HTTPConnection';
import { SENDER } from './constants';
import { StorageService } from './services/storage.service';
import { WebSocketConnection } from './connection-strategy/WebSocketConnection';
import { messageParser } from './message-parser/messageParser';
import { parseChatHistory } from './message-parser/utils/parse-chat-history';
import { v4 as uuidv4 } from 'uuid';

interface Options {
  url: string;
  protocol?: 'http' | 'ws';
  initialPayload?: string;
  authenticationToken?: string;
  senderId?: string;
  messageMetadata?: Record<string, unknown>;
}

export class Rasa extends EventEmitter {
  private _sessionId: string;
  private storageService: StorageService;
  private connection: HTTPConnection | WebSocketConnection;
  private initialPayload: string | undefined;
  private isInitialConnection: boolean;
  private isSessionConfirmed: boolean;
  private senderId?: string;
  private messageMetadata?: Record<string, unknown>;

  public constructor({ url, protocol = 'ws', initialPayload, authenticationToken, senderId, messageMetadata }: Options) {
    super();
    this.senderId = senderId;
    this._sessionId = senderId ? senderId : uuidv4();
    this.initialPayload = initialPayload;
    this.messageMetadata = messageMetadata;
    this.storageService = new StorageService();
    this.isInitialConnection = true;
    this.isSessionConfirmed = false;
    const Connection = protocol === 'ws' ? WebSocketConnection : HTTPConnection;
    const { onConnect, onDisconnect, onBotResponse, onSessionConfirm } = this;
    this.connection = new Connection({
      url,
      authenticationToken,
      onConnect,
      onDisconnect,
      onBotResponse,
      onSessionConfirm,
    });
  }

  public get sessionId(): string {
    return this._sessionId;
  }

  private set sessionId(value) {
    this._sessionId = value;
  }

  private loadChatHistory(): void {
    const chatHistory = this.storageService.getChatHistory() || [];
    this.trigger('loadHistory', parseChatHistory(chatHistory));
  }

  //#region Connection Event Handlers
  private onBotResponse = (data: unknown): void => {
    const timestamp = new Date();

    const responseData = data as {
      metadata?: unknown;
      custom?: unknown;
      customData?: unknown;
      userInput?: unknown;
    };

    const customData =
      responseData && typeof responseData.custom === 'object' && responseData.custom !== null
        ? (responseData.custom as { metadata?: unknown; userInput?: unknown })
        : undefined;

    const rootCustomData =
      responseData && typeof responseData.customData === 'object' && responseData.customData !== null
        ? (responseData.customData as { userInput?: unknown })
        : undefined;

    let metadataSource:
      | 'metadata'
      | 'custom.metadata'
      | 'custom.userInput'
      | 'customData'
      | 'userInput'
      | undefined;
    let extractedMetadata: unknown;

    if (responseData?.metadata !== undefined) {
      metadataSource = 'metadata';
      extractedMetadata = responseData.metadata;
    } else if (customData?.metadata !== undefined) {
      metadataSource = 'custom.metadata';
      extractedMetadata = customData.metadata;
    } else if (customData?.userInput !== undefined) {
      metadataSource = 'custom.userInput';
      extractedMetadata = { userInput: customData.userInput };
    } else if (rootCustomData !== undefined) {
      metadataSource = 'customData';
      extractedMetadata = rootCustomData;
    } else if (responseData?.userInput !== undefined) {
      metadataSource = 'userInput';
      extractedMetadata = { userInput: responseData.userInput };
    }

    if (extractedMetadata !== undefined) {
      console.log('[Rasa Chat Widget] response metadata source:', metadataSource);
      console.log('[Rasa Chat Widget] response metadata value:', extractedMetadata);
      this.trigger('responseMetadata', extractedMetadata);
    }

    const hasRenderableBotContent =
      responseData &&
      typeof responseData === 'object' &&
      (
        'text' in responseData ||
        'attachment' in responseData ||
        'quick_replies' in responseData ||
        'buttons' in responseData ||
        'elements' in responseData ||
        'image' in responseData
      );

    if (extractedMetadata !== undefined && !hasRenderableBotContent) {
      return;
    }

    try {
      const parsedMessage = messageParser({ ...(data as object), timestamp }, SENDER.BOT);
      this.storageService.setMessage({ sender: SENDER.BOT, ...(data as object), timestamp }, this.sessionId);
      this.trigger('message', parsedMessage);
    } catch {
      console.warn('Skipping unsupported bot message format', data);
    }
  };

  private onSessionConfirm = (): void => {
    if (this.isSessionConfirmed) {
      return;
    }
    this.isSessionConfirmed = true;
    const sessionStart = new Date();
    const isContinuesSession = this.storageService.setSession(this.sessionId, sessionStart);
    this.trigger('sessionConfirm');
    if (!isContinuesSession) {
      this.trigger('message', {
        type: 'sessionDivider',
        startDate: sessionStart,
      });
      // @TODO ask Tom about this behavior
      if (this.initialPayload) {
        if (this.messageMetadata) {
          this.connection.sendMessage(this.initialPayload, this.sessionId, this.messageMetadata);
        } else {
          this.connection.sendMessage(this.initialPayload, this.sessionId);
        }
      }
    }
  };

  private onConnect = (isReconnected = false) => {
    if (isReconnected) {
      this.connection.sessionRequest(this.sessionId);
      this.trigger('connect');
      return;
    }

    this.sessionId = this.senderId ? this.senderId : uuidv4();
    this.connection.sessionRequest(this.sessionId);

    if (this.isInitialConnection) {
      this.loadChatHistory();
      this.isInitialConnection = false;
    }
    this.trigger('connect');
  };

  private onDisconnect = () => {
    this.isSessionConfirmed = false;
    this.isInitialConnection = true;
    this.trigger('disconnect');
  };
  //#endregion

  //#region Public Methods
  public connect(): void {
    this.connection.connect();
  }

  public disconnect(): void {
    this.connection.disconnect();
  }

  public sendMessage(
    { text, reply, timestamp }: { text: string; reply?: string; timestamp?: Date },
    isQuickReply = false,
    messageKey?: number,
  ): void {
    if (this.messageMetadata) {
      this.connection.sendMessage(reply ?? text, this.sessionId, this.messageMetadata);
    } else {
      this.connection.sendMessage(reply ?? text, this.sessionId);
    }
    this.storageService.setMessage({ sender: SENDER.USER, text, timestamp }, this.sessionId);
    if (isQuickReply && messageKey && reply) {
      this.storageService.setQuickReplyValue(reply, messageKey, this.sessionId);
    }
  }

  public reconnection(value: boolean): void {
    this.connection.reconnection(value);
  }

  public overrideChatHistory = (chatHistoryString: string): void => {
    this.storageService.overrideChatHistory(chatHistoryString);
    this.loadChatHistory();
  }

  public getChatHistory(): string {
    return JSON.stringify(this.storageService.getChatHistory());
  }
  //#endregion
}

export * from './errors';
export * from './message-parser';
export * from './constants';
