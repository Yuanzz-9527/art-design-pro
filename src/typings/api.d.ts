/**
 * namespace: Api
 *
 * 所有接口相关类型定义
 * 在.vue文件使用会报错，需要在 eslint.config.mjs 中配置 globals: { Api: 'readonly' }
 */
declare namespace Api {
  /** 通用类型 */
  namespace Common {
    /** 分页参数 */
    interface PaginationParams {
      /** 当前页码 */
      pageNum: number
      /** 每页条数 */
      pageSize: number
      /** 总条数 */
      total: number
    }

    /** 通用搜索参数 */
    type PaginatingSearchParams = Pick<PaginationParams, 'pageNum' | 'pageSize'>

    // 若依列表类型
    interface RouyiListItem {
      createBy?: string // 创建人
      createTime?: string // 创建时间
      remark?: string // 备注
      updateBy?: string // 更新人
      updateTime?: string // 更新时间
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
  }
}
