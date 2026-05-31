/**
 * Доменные типы RPBINDER. Используются и в main-, и в renderer-процессах.
 */

/** Одно сообщение внутри отыгровки. */
export interface RPMessage {
  id: string
  /** Текст, который будет введён в игровой чат. Поддерживает плейсхолдеры {name} и т.п. */
  text: string
  /** Задержка перед отправкой ЭТОГО сообщения, мс. */
  delayMs: number
}

/** Отыгровка — последовательность сообщений, привязанная к горячей клавише. */
export interface Otygrovka {
  id: string
  name: string
  /** Сочетание клавиш в формате uiohook ("Ctrl+1", "F5", "Num1"). Пусто — не назначено. */
  hotkey: string
  messages: RPMessage[]
  /** Если включено — сообщения вставляются только по нажатию клавиши «Insert». */
  disableAutoSend: boolean
  /** Записывать видео с экрана во время проигрывания отыгровки. */
  recordVideo: boolean
}

/** Профиль — набор отыгровок с общими настройками ввода. */
export interface Profile {
  id: string
  name: string
  /** Публичная ссылка вида https://rpbinder.com/i/XXXXXXXX */
  link: string
  /** Доступен ли профиль в общем каталоге. */
  isPublic: boolean
  /** Клавиша открытия игрового чата (например "T"). */
  chatKey: string
  /** Глобальная задержка перед вставкой текста, мс. */
  pasteDelayMs: number
  otygrovki: Otygrovka[]
  /** Кол-во просмотров/использований публичного профиля. */
  views: number
  createdAt: number
  updatedAt: number
}

/** Глобальные настройки приложения. */
export interface AppSettings {
  language: 'ru' | 'en'
  theme: 'dark' | 'light'
  /** Запускать приложение вместе с системой. */
  autoLaunch: boolean
  /** Сворачивать в трей вместо закрытия. */
  minimizeToTray: boolean
  /** Клавиша подтверждения ручной вставки (когда отключён автоввод). */
  insertKey: string
  /** Запущен ли процесс с правами администратора (для глобальных хоткеев). */
  runningAsAdmin: boolean
}

/** Карточка профиля в публичном каталоге. */
export interface CatalogItem {
  id: string
  name: string
  author: string
  description: string
  link: string
  views: number
  otygrovkiCount: number
  tags: string[]
  /** Готовое содержимое профиля, устанавливаемое при «Добавить профиль». */
  data?: {
    chatKey: string
    pasteDelayMs: number
    otygrovki: Otygrovka[]
  }
}

/** Состояние работающего движка отыгровок. */
export interface EngineState {
  running: boolean
  activeProfileId: string | null
  /** Сейчас проигрывается отыгровка (id) или null. */
  playingOtygrovkaId: string | null
}

/** Статус процесса авто-обновления, транслируется в интерфейс. */
export interface UpdateStatus {
  state:
    | 'idle'
    | 'checking'
    | 'available'
    | 'not-available'
    | 'downloading'
    | 'downloaded'
    | 'error'
    | 'disabled'
  /** Версия найденного обновления. */
  version?: string
  /** Прогресс загрузки, 0..100. */
  percent?: number
  message?: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'ru',
  theme: 'dark',
  autoLaunch: false,
  minimizeToTray: true,
  insertKey: 'Insert',
  runningAsAdmin: false
}
