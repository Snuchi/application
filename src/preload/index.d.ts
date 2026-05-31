import type { RPBinderApi } from './index'

declare global {
  interface Window {
    api: RPBinderApi
  }
}

export {}
