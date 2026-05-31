import { CatalogItem, Profile } from '../shared/types'
import { db, newOtygrovka, newProfile } from './store'

/**
 * Сервис публичного каталога готовых скриптов.
 *
 * Источник — файл catalog.json в репозитории (raw.githubusercontent). Это
 * позволяет добавлять новые скрипты без пересборки приложения. При недоступности
 * сети используется встроенный демо-набор.
 */

const CATALOG_URL =
  'https://raw.githubusercontent.com/Snuchi/application/claude/youthful-cannon-V2yhe/catalog.json'

/** Встроенный резервный набор (если каталог недоступен). */
const FALLBACK: CatalogItem[] = [
  {
    id: 'demo-medic',
    name: 'Медик / EMS',
    author: 'RPBINDER',
    description: 'Осмотр, реанимация, перевязка.',
    link: 'https://rpbinder.com/i/MEDIC001',
    views: 1240,
    otygrovkiCount: 3,
    tags: ['медицина', 'EMS'],
    data: {
      chatKey: 'T',
      pasteDelayMs: 120,
      otygrovki: [
        {
          id: 'm-osmotr',
          name: 'Осмотр',
          hotkey: '',
          disableAutoSend: false,
          recordVideo: false,
          messages: [
            { id: '1', text: '/me осматривает пострадавшего на наличие травм', delayMs: 800 },
            { id: '2', text: '/do Видимых повреждений не обнаружено.', delayMs: 1500 }
          ]
        }
      ]
    }
  }
]

let cache: CatalogItem[] | null = null

/** Строит профиль из карточки каталога (с готовыми отыгровками, если есть). */
function buildProfileFromCatalog(item: CatalogItem): Profile {
  const otygrovki = item.data?.otygrovki?.length
    ? item.data.otygrovki.map((o) => newOtygrovka(o))
    : [newOtygrovka({ name: 'Пример отыгровки' })]
  return newProfile({
    name: item.name,
    isPublic: false,
    chatKey: item.data?.chatKey ?? 'T',
    pasteDelayMs: item.data?.pasteDelayMs ?? 100,
    otygrovki
  })
}

export const catalog = {
  async list(query = ''): Promise<CatalogItem[]> {
    const items = await this.fetchRemote()
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q))
    )
  },

  /** Устанавливает профиль из каталога в локальное хранилище. */
  async install(catalogId: string): Promise<Profile | null> {
    const items = await this.fetchRemote()
    const item = items.find((i) => i.id === catalogId)
    if (!item) return null
    return db.createProfile(buildProfileFromCatalog(item))
  },

  /** Загружает каталог из репозитория; при ошибке возвращает встроенный набор. */
  async fetchRemote(): Promise<CatalogItem[]> {
    if (cache) return cache
    try {
      const res = await fetch(CATALOG_URL, { cache: 'no-cache' } as RequestInit)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { items?: CatalogItem[] }
      const items = Array.isArray(data) ? (data as CatalogItem[]) : data.items
      if (items?.length) {
        cache = items
        return items
      }
      throw new Error('пустой каталог')
    } catch (err) {
      console.warn('[catalog] не удалось загрузить, использую встроенный набор:', (err as Error).message)
      return FALLBACK
    }
  }
}
