import request from '@/utils/http'
import type { User } from './user'
import { Status } from '@/types'

export interface Role {
  admin?: boolean
  roleId: number
  roleKey: string
  roleName: string
  roleSort: number
  menuCheckStrictly: boolean
  deptCheckStrictly: boolean
  dataScope: '1' | '2' | '3' | '4' | '5'
  deptIds?: number[]
  menuIds?: number[]
  status: Status
  remark: string
}

export class RoleService {
  // 查询角色列表
  static listRole(params: Api.Common.PaginatingSearchParams & Record<string, unknown>) {
    return request.get<Http.ListResponse<Role>>({
      url: '/system/role/list',
      params
    })
  }

  // 查询角色详细
  static getRole(roleId: number) {
    return request.get<Http.BaseResponse<Role>>({
      url: '/system/role/' + roleId
    })
  }

  // 新增角色
  static addRole(params: Partial<Role>) {
    return request.post({
      url: '/system/role',
      params
    })
  }

  // 修改角色
  static updateRole(params: Partial<Role>) {
    return request.put({
      url: '/system/role',
      params
    })
  }

  // 角色数据权限
  static dataScope(params: Partial<Role>) {
    return request.put({
      url: '/system/role/dataScope',
      params
    })
  }

  // 角色状态修改
  static changeRoleStatus(roleId: number, status: string) {
    const params = {
      roleId,
      status
    }
    return request.put({
      url: '/system/role/changeStatus',
      params
    })
  }

  // 删除角色
  static delRole(roleIds: number | string) {
    return request.del({
      url: '/system/role/' + roleIds
    })
  }

  // 查询角色已授权用户列表
  static allocatedUserList(params: Api.Common.PaginatingSearchParams & Record<string, unknown>) {
    return request.get<Http.ListResponse<User>>({
      url: '/system/role/authUser/allocatedList',
      params
    })
  }

  // 查询角色未授权用户列表
  static unallocatedUserList(params: Api.Common.PaginatingSearchParams & Record<string, unknown>) {
    return request.get<Http.ListResponse<User>>({
      url: '/system/role/authUser/unallocatedList',
      params
    })
  }

  // 取消用户授权角色
  static authUserCancel(roleId: number, userId: number) {
    const params = {
      roleId,
      userId
    }
    return request.put({
      url: '/system/role/authUser/cancel',
      params
    })
  }

  // 批量取消用户授权角色
  static authUserCancelAll(roleId: number, userIds: string) {
    const params = {
      roleId,
      userIds
    }
    return request.put({
      url: '/system/role/authUser/cancelAll',
      params
    })
  }

  // 授权用户选择
  static authUserSelectAll(roleId: number, userIds: string) {
    const params = {
      roleId,
      userIds
    }
    return request.put({
      url: '/system/role/authUser/selectAll',
      params
    })
  }

  // 根据角色ID查询部门树结构
  static deptTreeSelect(roleId: number) {
    return request.get<Http.BaseResponse>({
      url: '/system/role/deptTree/' + roleId
    })
  }
}
