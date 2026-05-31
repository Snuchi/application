// Утилита для визуальной проверки: грузит собранный рендерер и сохраняет PNG.
// Запуск: xvfb-run -a node_modules/.bin/electron scripts/capture.cjs <out.png>
const { app, BrowserWindow, ipcMain } = require('electron')
const { join } = require('path')
const fs = require('fs')

const out = process.argv[2] || '/tmp/rpbinder.png'

// Заглушки IPC, чтобы renderer мог инициализироваться без полного main.
const demoProfiles = [
  {
    id: 'avn',
    name: 'AVN',
    link: 'https://rpbinder.com/i/YPRfkAS8',
    isPublic: false,
    chatKey: 'T',
    pasteDelayMs: 100,
    otygrovki: [{ id: 'o1', name: 'Новая отыгровка', hotkey: '', messages: [], disableAutoSend: false, recordVideo: false }],
    views: 0,
    createdAt: 0,
    updatedAt: 0
  },
  {
    id: 'np',
    name: 'Новый профиль',
    link: 'https://rpbinder.com/i/YPRfkAS8',
    isPublic: false,
    chatKey: 'T',
    pasteDelayMs: 100,
    otygrovki: [],
    views: 0,
    createdAt: 0,
    updatedAt: 0
  }
]
const handlers = {
  'profiles:list': () => demoProfiles,
  'settings:get': () => ({ language: 'ru', theme: 'dark', autoLaunch: false, minimizeToTray: true, insertKey: 'Insert', runningAsAdmin: false }),
  'engine:state': () => ({ running: false, activeProfileId: null, playingOtygrovkaId: null })
}
for (const [ch, fn] of Object.entries(handlers)) ipcMain.handle(ch, fn)
ipcMain.handle('catalog:list', () => [])

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 900,
    height: 640,
    show: false,
    frame: false,
    backgroundColor: '#15161b',
    webPreferences: { preload: join(__dirname, '../out/preload/index.js'), sandbox: false }
  })
  await win.loadFile(join(__dirname, '../out/renderer/index.html'))
  await new Promise((r) => setTimeout(r, 1200))

  const shot = async (name) => {
    const img = await win.webContents.capturePage()
    const path = out.replace(/\.png$/, `-${name}.png`)
    fs.writeFileSync(path, img.toPNG())
    console.log('saved', path)
  }
  const clickNth = (sel, n) =>
    win.webContents.executeJavaScript(
      `(()=>{const el=document.querySelectorAll('${sel}')[${n}];if(el){el.click();return true}return false})()`
    )
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))

  await shot('profiles')
  await clickNth('.list-row', 0) // -> редактор профиля (AVN)
  await wait(600)
  await shot('profile')
  await clickNth('.list-row', 0) // -> редактор отыгровки
  await wait(600)
  await shot('otygrovka')

  app.quit()
})
