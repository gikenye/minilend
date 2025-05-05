declare module "ws";

declare module "ws" {
  import { EventEmitter } from "events";

  export class WebSocket extends EventEmitter {
    constructor(address: string | URL, options?: WebSocket.ClientOptions);
    readyState: number;
    url: string;
    protocol: string;
    binaryType: "nodebuffer" | "arraybuffer" | "fragments";
    send(
      data: any,
      options?: {
        mask?: boolean;
        binary?: boolean;
        compress?: boolean;
        fin?: boolean;
      },
      cb?: (err?: Error) => void
    ): void;
    terminate(): void;
    close(code?: number, data?: string): void;
    ping(data?: any, mask?: boolean, cb?: (err: Error) => void): void;
    pong(data?: any, mask?: boolean, cb?: (err: Error) => void): void;

    // EventEmitter methods
    on(event: "close", listener: (code: number, reason: string) => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "upgrade", listener: (request: any) => void): this;
    on(event: "message", listener: (data: any) => void): this;
    on(event: "open", listener: () => void): this;
    on(event: "ping" | "pong", listener: (data: any) => void): this;
    on(
      event: "unexpected-response",
      listener: (request: any, response: any) => void
    ): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
  }

  export namespace WebSocket {
    interface ClientOptions {
      protocol?: string;
      handshakeTimeout?: number;
      perMessageDeflate?: boolean | PerMessageDeflateOptions;
      localAddress?: string;
      protocolVersion?: number;
      headers?: { [key: string]: string };
      origin?: string;
      host?: string;
      family?: number;
      checkServerIdentity?: (hostname: string, cert: any) => boolean;
      rejectUnauthorized?: boolean;
      maxPayload?: number;
      skipUTF8Validation?: boolean;
    }

    interface PerMessageDeflateOptions {
      serverNoContextTakeover?: boolean;
      clientNoContextTakeover?: boolean;
      serverMaxWindowBits?: number;
      clientMaxWindowBits?: number;
      zlibDeflateOptions?: {
        level: number;
        memLevel: number;
        strategy: number;
      };
      zlibInflateOptions?: {
        windowBits: number;
      };
      threshold?: number;
      concurrencyLimit?: number;
    }
  }
}
