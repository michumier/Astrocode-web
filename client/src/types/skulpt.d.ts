// Type declarations for Skulpt
declare global {
  interface Window {
    Sk: {
      pre: string;
      configure: (config: {
        output?: (text: string) => void;
        read?: (filename: string) => string;
        inputfun?: (prompt: string) => string | null;
        inputfunTakesPrompt?: boolean;
      }) => void;
      misceval: {
        asyncToPromise: (func: () => any) => Promise<any>;
      };
      importMainWithBody: (name: string, dumpJS: boolean, body: string, canSuspend: boolean) => any;
      builtinFiles: {
        files: { [key: string]: string };
      };
    };
  }
}

export {};