import request from '@/utils/http'

export class UserService {
  // 登录
  static login(params: Api.Auth.LoginParams) {
    return request.post<Api.Auth.LoginResponse>({
      url: '/login',
      params
      // showErrorMessage: false // 不显示错误消息
    })
  }

  // 获取用户信息
  static getUserInfo() {
    return request.get<Api.User.UserInfoResponse>({
      url: '/getInfo'
      // 自定义请求头
      // headers: {
      //   'X-Custom-Header': 'your-custom-value'
      // }
    })
  }

  // 退出登录
  static logout() {
    return request.post<void>({
      url: '/logout'
    })
  }

  // 获取图形验证码
  static getCodeImg() {
    return request.get<Api.Auth.CaptchaImageResponse>({
      url: '/captchaImage',
      headers: {
        isToken: false
      }
    })
  }
}
