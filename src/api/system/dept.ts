import request from '@/utils/http'

export interface Dept {
  children?: Dept[]
  deptId: number
  deptName: string
  parentId: number
  ancestors: string
  orderNum: number
  leader: string
  phone: string
  email: string
  status: string
  delFlag: string
}

export class DeptService {
  // 查询部门列表
  static listDept(params?: Record<string, unknown>) {
    return request.get<Http.BaseResponse<Dept[]>>({
      url: '/system/dept/list',
      params
    })
  }

  // 查询部门详细
  static getDept(deptId: number) {
    return request.get<Http.BaseResponse<Dept>>({
      url: '/system/dept/' + deptId
    })
  }

  // 新增部门
  static addDept(params: Dept) {
    return request.post({
      url: '/system/dept',
      params
    })
  }

  // 修改部门
  static updateDept(params: Dept) {
    return request.put({
      url: '/system/dept',
      params
    })
  }

  // 删除部门
  static delDept(deptId: number | string) {
    return request.del({
      url: '/system/dept/' + deptId
    })
  }

  // 查询部门列表（排除节点）
  static listDeptExcludeChild(deptId: number) {
    return request.get<Http.BaseResponse<Dept[]>>({
      url: '/system/dept/list/exclude/' + deptId
    })
  }
}
