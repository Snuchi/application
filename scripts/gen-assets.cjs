// Генерация ассетов: иконка приложения (.ico/.png) и картинки установщика (BMP).
// Использует jimp. Запуск: node scripts/gen-assets.cjs
const Jimp = require('jimp')
const fs = require('fs')
const path = require('path')

const OUT = path.join(__dirname, '..', 'build')
fs.mkdirSync(OUT, { recursive: true })

const DARK = 0x1b1b1dff
const GOLD = { r: 0xe8, g: 0xb9, b: 0x23 }
const PURPLE = { r: 0x7b, g: 0x5c, b: 0xff }
const INDIGO = { r: 0x2a, g: 0x21, b: 0x4a }

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t)
}

// Перекрашивает белый текст шрифта в золотой.
function tintGold(img) {
  img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
    const a = this.bitmap.data[idx + 3]
    if (a > 10) {
      this.bitmap.data[idx] = GOLD.r
      this.bitmap.data[idx + 1] = GOLD.g
      this.bitmap.data[idx + 2] = GOLD.b
    }
  })
  return img
}

// Рисует скруглённый угол-маску (прозрачность по углам).
function roundCorners(img, radius) {
  const w = img.bitmap.width
  const h = img.bitmap.height
  img.scan(0, 0, w, h, function (x, y, idx) {
    const corners = [
      [radius, radius],
      [w - radius, radius],
      [radius, h - radius],
      [w - radius, h - radius]
    ]
    let outside = false
    if (x < radius && y < radius) outside = Math.hypot(x - radius, y - radius) > radius
    else if (x > w - radius && y < radius) outside = Math.hypot(x - (w - radius), y - radius) > radius
    else if (x < radius && y > h - radius) outside = Math.hypot(x - radius, y - (h - radius)) > radius
    else if (x > w - radius && y > h - radius)
      outside = Math.hypot(x - (w - radius), y - (h - radius)) > radius
    void corners
    if (outside) this.bitmap.data[idx + 3] = 0
  })
  return img
}

async function makeLogo(size, fontPath) {
  const img = new Jimp(size, size, DARK)
  roundCorners(img, Math.round(size * 0.22))
  const font = await Jimp.loadFont(fontPath)
  const text = 'AVN'
  const tw = Jimp.measureText(font, text)
  const th = Jimp.measureTextHeight(font, text, size)
  let label = new Jimp(tw + 8, th + 8, 0x00000000)
  label.print(font, 4, 0, text)
  // Обрезать прозрачные поля и отмасштабировать под ~70% ширины иконки.
  label.autocrop({ tolerance: 0.0, cropOnlyFrames: false })
  tintGold(label)
  const target = Math.round(size * 0.7)
  label.scaleToFit(target, target)
  img.composite(
    label,
    Math.round((size - label.bitmap.width) / 2),
    Math.round((size - label.bitmap.height) / 2)
  )
  return img
}

// PNG -> .ico (встраиваем PNG, поддерживается Windows Vista+).
function pngToIco(pngBuffer) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)
  const entry = Buffer.alloc(16)
  entry.writeUInt8(0, 0) // width 0 = 256
  entry.writeUInt8(0, 1) // height 0 = 256
  entry.writeUInt8(0, 2)
  entry.writeUInt8(0, 3)
  entry.writeUInt16LE(1, 4)
  entry.writeUInt16LE(32, 6)
  entry.writeUInt32LE(pngBuffer.length, 8)
  entry.writeUInt32LE(22, 12)
  return Buffer.concat([header, entry, pngBuffer])
}

async function main() {
  // --- Иконка 256 ---
  const logo = await makeLogo(256, Jimp.FONT_SANS_128_WHITE)
  await logo.writeAsync(path.join(OUT, 'icon.png'))
  const png = await logo.getBufferAsync(Jimp.MIME_PNG)
  fs.writeFileSync(path.join(OUT, 'icon.ico'), pngToIco(png))

  // --- Боковая картинка установщика 164x314 (диагональный градиент + логотип) ---
  const sw = 164
  const sh = 314
  const side = new Jimp(sw, sh, 0x000000ff)
  side.scan(0, 0, sw, sh, function (x, y, idx) {
    const t = (x / sw + y / sh) / 2
    this.bitmap.data[idx] = lerp(INDIGO.r, PURPLE.r, t)
    this.bitmap.data[idx + 1] = lerp(INDIGO.g, PURPLE.g, t)
    this.bitmap.data[idx + 2] = lerp(INDIGO.b, PURPLE.b, t)
    this.bitmap.data[idx + 3] = 255
  })
  const badge = await makeLogo(90, Jimp.FONT_SANS_64_WHITE)
  side.composite(badge, Math.round((sw - 90) / 2), 84)
  const fontS = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE)
  const title = 'AVN Binder'
  side.print(fontS, Math.round((sw - Jimp.measureText(fontS, title)) / 2), 190, title)
  await side.writeAsync(path.join(OUT, 'installerSidebar.bmp'))

  // --- Шапка установщика 150x57 ---
  const hw = 150
  const hh = 57
  const head = new Jimp(hw, hh, DARK)
  const headBadge = await makeLogo(40, Jimp.FONT_SANS_32_WHITE)
  head.composite(headBadge, 8, 8)
  const fontH = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE)
  head.print(fontH, 56, 20, 'AVN Binder')
  await head.writeAsync(path.join(OUT, 'installerHeader.bmp'))

  console.log('assets generated in build/:', fs.readdirSync(OUT).join(', '))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
