import { Status } from '@/types'
import request from '@/utils/http'
import { TreeData } from 'element-plus'

export interface Menu {
  children?: Menu[]
  component: string
  icon: string
  isCache: Status
  isFrame: Status
  menuId: number
  menuName: string
  menuType: 'M' | 'C' | 'F'
  orderNum: number
  parentId: number
  parentName: string
  path: string
  perms: string
  query: string
  routeName: string
  status: Status
  visible: Status
}
export class MenuService {
  // 查询菜单列表
  static listMenu(params: Record<string, string | undefined>) {
    return request.get<Api.Common.DataResponse<Menu[]>>({
      url: '/system/menu/list',
      params
    })
  }

  // 查询菜单详细
  static getMenu(menuId: number) {
    return request.get<Api.Common.DataResponse<Menu>>({
      url: '/system/menu/' + menuId
    })
  }

  // 查询菜单下拉树结构
  static treeSelect() {
    return request.get<Api.Common.DataResponse<TreeData>>({
      url: '/system/menu/treeselect'
    })
  }

  // 根据角色ID查询菜单下拉树结构
  static roleMenuTreeselect(roleId: number) {
    return request.get<Api.Common.DataResponse>({
      url: '/system/menu/roleMenuTreeselect/' + roleId
    })
  }

  // 新增菜单
  static addMenu(params: Menu) {
    return request.post({
      url: '/system/menu',
      params
    })
  }

  // 修改菜单
  static updateMenu(params: Menu) {
    return request.put({
      url: '/system/menu',
      params
    })
  }

  // 删除菜单
  static delMenu(menuId: number) {
    return request.del({
      url: '/system/menu/' + menuId
    })
  }
}
