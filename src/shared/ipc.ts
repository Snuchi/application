/** Имена IPC-каналов. Единый источник правды для main и preload. */
export const IPC = {
  // Профили
  ProfilesList: 'profiles:list',
  ProfileGet: 'profiles:get',
  ProfileCreate: 'profiles:create',
  ProfileUpdate: 'profiles:update',
  ProfileDelete: 'profiles:delete',
  ProfileImport: 'profiles:import',

  // Настройки
  SettingsGet: 'settings:get',
  SettingsUpdate: 'settings:update',

  // Движок отыгровок
  EngineStart: 'engine:start',
  EngineStop: 'engine:stop',
  EngineState: 'engine:state',
  EnginePlay: 'engine:play',

  // Хоткеи / захват клавиш
  HotkeyCaptureStart: 'hotkey:capture-start',
  HotkeyCaptureStop: 'hotkey:capture-stop',

  // Окно
  WindowMinimize: 'window:minimize',
  WindowMaximize: 'window:maximize',
  WindowClose: 'window:close',

  // Обновления / версия
  AppVersion: 'app:version',
  UpdateCheck: 'update:check',
  UpdateInstall: 'update:install',

  // События main -> renderer
  EvtEngineState: 'evt:engine-state',
  EvtHotkeyCaptured: 'evt:hotkey-captured',
  EvtPlaybackLog: 'evt:playback-log',
  EvtUpdate: 'evt:update'
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
