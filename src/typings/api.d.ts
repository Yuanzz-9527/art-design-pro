/**
 * namespace: Api
 *
 * 所有接口相关类型定义
 * 在.vue文件使用会报错，需要在 eslint.config.mjs 中配置 globals: { Api: 'readonly' }
 */
declare namespace Api {
  /** 基础类型 */
  namespace Http {
    /** 基础响应 */
    interface BaseResponse<T = any> {
      // 状态码
      code: number
      // 消息
      msg: string
      // 数据
      data: T
    }
  }

  /** 通用类型 */
  namespace Common {
    /** 分页参数 */
    interface PaginatingParams {
      /** 当前页码 */
      pageNum: number
      /** 每页条数 */
      pageSize: number
      /** 总条数 */
      total: number
    }

    /** 通用搜索参数 */
    type PaginatingSearchParams = Pick<PaginatingParams, 'pageNum' | 'pageSize'>

    /** 启用状态 */
    type EnableStatus = '1' | '2'

    /** 通用数据响应 */
    interface DataResponse<T = any> {
      msg: string
      data: T
      code: number
      [key: string]: any
    }

    /** 列表数据响应 */
    interface ListResponse<T extends RouyiListItem = RouyiListItem> {
      msg: string
      rows: T[]
      code: number
      [key: string]: any
    }
  }

  /** 认证类型 */
  namespace Auth {
    /** 登录参数 */
    interface LoginParams {
      username: string
      password: string
      code: number
      uuid: string
    }

    /** 登录响应 */
    interface LoginResponse {
      token: string
      refreshToken?: string
    }

    /** 验证码响应 */
    interface CaptchaImageResponse {
      captchaEnabled: true | false
      img: string
      uuid: string
    }
  }

  /** 用户类型 */
  namespace User {
    /** 用户信息 */
    interface UserInfo {
      userId: number
      userName: string
      nickName: string
      sex: '0' | '1' | '2'
      roles: string[]
      permissions: string[]
      deptId?: number
      dept?: {
        deptName: string
      }
      avatar?: string
      email?: string
      phone?: string
      admin?: true | false
      phonenumber?: string
      email?: string
    }

    /** 查询用户信息响应（getInfo） */
    interface UserInfoResponse {
      isPasswordExpired: true | false
      isDefaultModifyPwd: true | false
      permissions: string[]
      roles: string[]
      user: UserInfo
    }

    /** 用户列表数据 */
    interface UserListData {
      records: UserListItem[]
      current: number
      size: number
      total: number
    }

    /** 用户列表项 */
    interface UserListItem {
      id: number
      avatar: string
      createBy: string
      createTime: string
      updateBy: string
      updateTime: string
      status: '1' | '2' | '3' | '4' // 1: 在线 2: 离线 3: 异常 4: 注销
      userName: string
      userGender: string
      nickName: string
      userPhone: string
      userEmail: string
      userRoles: string[]
    }
  }
}
