import { CatalogItem, Profile } from '../shared/types'
import { db, newOtygrovka, newProfile } from './store'

/**
 * Сервис публичного каталога.
 *
 * Сейчас реализован локально (демо-данные). Точка подключения к реальному API —
 * метод fetchRemote(): замените тело на запрос к https://api.rpbinder.com/catalog.
 */

const DEMO: CatalogItem[] = [
  {
    id: 'demo-medic',
    name: 'Медик / EMS',
    author: 'RPBINDER',
    description: 'Набор отыгровок для медика: осмотр, реанимация, перевязка.',
    link: 'https://rpbinder.com/i/MEDIC001',
    views: 1240,
    otygrovkiCount: 8,
    tags: ['медицина', 'EMS', 'госслужба']
  },
  {
    id: 'demo-police',
    name: 'Полиция / LSPD',
    author: 'RPBINDER',
    description: 'Задержание, обыск, оформление протокола, зачитывание прав.',
    link: 'https://rpbinder.com/i/POLICE01',
    views: 3580,
    otygrovkiCount: 12,
    tags: ['полиция', 'госслужба']
  },
  {
    id: 'demo-mech',
    name: 'Механик / СТО',
    author: 'RPBINDER',
    description: 'Диагностика, ремонт двигателя, замена колеса, покраска.',
    link: 'https://rpbinder.com/i/MECH0001',
    views: 890,
    otygrovkiCount: 6,
    tags: ['работа', 'авто']
  }
]

/** Демо-наполнение для устанавливаемого профиля. */
function buildProfileFromCatalog(item: CatalogItem): Profile {
  return newProfile({
    name: item.name,
    isPublic: false,
    otygrovki: [
      newOtygrovka({
        name: 'Пример отыгровки',
        messages: [{ id: 'm1', text: `/me ${item.name}: начинает действие`, delayMs: 1000 }]
      })
    ]
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

  /**
   * Источник данных каталога. Локальная реализация возвращает демо-набор.
   * TODO: подключить реальный бэкенд (fetch к API), сохранив сигнатуру.
   */
  async fetchRemote(): Promise<CatalogItem[]> {
    return DEMO
  }
}
