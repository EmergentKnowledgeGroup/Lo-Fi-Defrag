import type { DesktopApi } from './types';

declare global {
  interface Window {
    lofiDefragger: DesktopApi;
  }
}

export {};
