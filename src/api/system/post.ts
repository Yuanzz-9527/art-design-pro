import request from '@/utils/http'

export interface Post {
  postId: number
  postCode: string
  postName: string
  postSort: number
  status: string
}

export class PostService {
  // 查询岗位信息列表
  static listPost(params: Api.Common.PaginatingSearchParams & Record<string, unknown>) {
    return request.get<Api.Common.ListResponse<Post[]>>({
      url: '/system/post/list',
      params
    })
  }

  // 查询岗位信息详细
  static getPost(postId: number) {
    return request.get<Api.Common.DataResponse<Post>>({
      url: '/system/post/' + postId
    })
  }

  // 新增岗位信息
  static addPost(params: Post) {
    return request.post({
      url: '/system/post',
      params
    })
  }

  // 修改岗位信息
  static updatePost(params: Post) {
    return request.put({
      url: '/system/post',
      params
    })
  }

  // 删除岗位信息
  static delPost(postId: number | string) {
    return request.del({
      url: '/system/post/' + postId
    })
  }
}
