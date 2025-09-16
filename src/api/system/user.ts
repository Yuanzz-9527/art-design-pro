import { Gender, Status } from '@/types'
import request from '@/utils/http'
import { TreeData } from 'element-plus'

export interface User {
  admin: boolean
  avatar: string
  deptId: number
  dept: unknown
  email: string
  nickName: string
  phonenumber: string
  password: string
  sex: Gender
  status: Status
  userId: number
  userName: string
  postIds: number[]
  roleIds: number[]
}

export class UserService {
  // 用户列表
  static listUser(params: Api.Common.PaginatingSearchParams) {
    return request.get<Api.Common.ListResponse<User>>({
      url: '/system/user/list',
      params
    })
  }

  // 查询用户详细
  static getUser(userId?: number | number[]) {
    const userId_ = userId ? userId.toString() : ''
    return request.get<Api.Common.DataResponse<User>>({
      url: '/system/user/' + userId_
    })
  }

  // 新增用户
  static addUser(params: Partial<User>) {
    return request.post<Api.Common.DataResponse>({
      url: '/system/user',
      params
    })
  }

  // 修改用户
  static updateUser(params: Partial<User>) {
    return request.put<Api.Common.DataResponse>({
      url: '/system/user',
      params
    })
  }

  // 删除用户
  static delUser(userId: number | number[]) {
    return request.del({
      url: '/system/user/' + userId.toString()
    })
  }

  // 用户密码重置
  static resetUserPwd(userId: number, password: string) {
    const params = {
      userId,
      password
    }
    return request.put({
      url: '/system/user/resetPwd',
      params
    })
  }

  // 查询用户个人信息
  static getUserProfile() {
    return request.get({
      url: '/system/user/profile'
    })
  }

  // 修改用户个人信息
  static updateUserProfile(params: Partial<User>) {
    return request.put({
      url: '/system/user/profile',
      params
    })
  }

  // 用户状态修改
  static changeUserStatus(userId: number, status: string) {
    const params = {
      userId,
      status
    }
    return request.put({
      url: '/system/user/changeStatus',
      params
    })
  }

  // 用户密码重置
  static updateUserPwd(oldPassword: string, newPassword: string) {
    const params = {
      oldPassword,
      newPassword
    }
    return request.put({
      url: '/system/user/profile/updatePwd',
      params
    })
  }

  // 用户头像上传
  static uploadAvatar(params) {
    return request.post({
      url: '/system/user/profile/avatar',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      params
    })
  }

  // 查询授权角色
  static getAuthRole(userId: number) {
    return request.get({
      url: '/system/user/authRole/' + userId
    })
  }

  // 保存授权角色
  static updateAuthRole(params) {
    return request.put({
      url: '/system/user/authRole',
      params
    })
  }

  // 查询部门下拉树结构
  static deptTreeSelect() {
    return request.get<Api.Common.DataResponse<TreeData>>({
      url: '/system/user/deptTree'
    })
  }
}
