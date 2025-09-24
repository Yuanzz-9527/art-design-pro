import { RoutesAlias } from '@/router/routesAlias'
import { menuDataToRouter } from '@/router/utils/menuToRouter'
import { AppRouteRecord } from '@/types/router'
import request from '@/utils/http'

interface MenuResponse {
  menuList: AppRouteRecord[]
}

// 若依菜单
interface RuoyiMenu {
  path: string
  name: string
  hidden: boolean
  meta: {
    title: string
    icon: string
    noCache: boolean
    link: string | null
  }
  component: string
  children?: RuoyiMenu[]
  query?: string
}

// 菜单接口
export const menuService = {
  async getMenuList(): Promise<MenuResponse> {
    try {
      const { data } = await request.get<Api.Common.DataResponse<RuoyiMenu[]>>({
        url: '/getRouters'
      })
      if (!data.length) {
        console.warn('菜单数据为空！')
        return { menuList: [] }
      }
      // 模拟接口返回的菜单数据
      const menuData = ruoyiMenu2AppRouteRecord(data)
      // 处理菜单数据
      const menuList = menuData.map((route) => menuDataToRouter(route))
      return { menuList }
    } catch (error) {
      throw error instanceof Error ? error : new Error('获取菜单失败')
    }
  }
}

/**
 * 若依菜单转 AppRouteRecord
 */
const ruoyiMenu2AppRouteRecord = (menuList: RuoyiMenu[]): AppRouteRecord[] => {
  const transform = (menu: RuoyiMenu): AppRouteRecord => {
    const route: AppRouteRecord = {
      path: menu.path,
      name: menu.name,
      component:
        menu.component === 'Layout'
          ? RoutesAlias.Layout
          : menu.component.startsWith('/')
            ? menu.component
            : '/' + menu.component,
      meta: {
        title: menu.meta.title,
        icon: menu.meta.icon,
        keepAlive: !menu.meta.noCache,
        link: menu.meta.link ?? '',
        isIframe: menu.meta.link ? true : false,
        isHide: menu.hidden,
        query: menu.query // 保留 query
      }
    }

    if (menu.children && menu.children.length > 0) {
      route.children = menu.children.map(transform)
    }

    return route
  }

  return menuList.map(transform)
}
