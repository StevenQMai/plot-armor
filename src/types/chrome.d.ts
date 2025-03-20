export interface ChromeMessage {
  type: string;
  shows?: Show[];
}

export interface Show {
  id: string;
  title: string;
  type: 'show' | 'movie';
}

declare global {
  namespace chrome {
    namespace storage {
      interface StorageArea {
        get(keys: string[], callback: (result: { [key: string]: any }) => void): void;
        set(items: { [key: string]: any }, callback?: () => void): void;
      }
      const sync: StorageArea;
    }

    namespace runtime {
      interface MessageSender {
        tab?: chrome.tabs.Tab;
        frameId?: number;
        id?: string;
        url?: string;
      }

      interface MessageResponse {
        (response?: any): void;
      }

      interface OnMessageListener {
        (message: any, sender: MessageSender, sendResponse: MessageResponse): void | boolean;
      }

      const onMessage: {
        addListener(callback: OnMessageListener): void;
      };
    }

    namespace tabs {
      interface Tab {
        id?: number;
        url?: string;
        active: boolean;
      }

      interface QueryInfo {
        active: boolean;
        currentWindow: boolean;
      }

      function query(queryInfo: QueryInfo, callback: (tabs: Tab[]) => void): void;
      function sendMessage(tabId: number, message: any, responseCallback?: (response: any) => void): void;
    }
  }
} 