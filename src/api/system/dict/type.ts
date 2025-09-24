import request from '@/utils/http'

export interface DictType {
  dictId: number
  dictName: string
  dictType: string
  status: string
  remark: string
}

export class DictTypeService {
  // 查询字典类型列表
  static listDictType(params: Api.Common.PaginatingSearchParams & Record<string, unknown>) {
    return request.get<Api.Common.ListResponse<DictType[]>>({
      url: '/system/dict/type/list',
      params
    })
  }

  // 查询字典类型详细
  static getDictType(dictId: number) {
    return request.get<Api.Common.DataResponse<DictType>>({
      url: '/system/dict/type/' + dictId
    })
  }

  // 新增字典类型
  static addDictType(params: DictType) {
    return request.post({
      url: '/system/dict/type',
      params
    })
  }

  // 修改字典类型
  static updateDictType(params: DictType) {
    return request.put({
      url: '/system/dict/type',
      params
    })
  }

  // 删除字典类型
  static delDictType(dictId: number | string) {
    return request.del({
      url: '/system/dict/type/' + dictId
    })
  }

  // 刷新字典缓存
  static refreshCache() {
    return request.del({
      url: '/system/dict/dict/type/refreshCache'
    })
  }

  // 获取字典选择框列表
  static optionselect() {
    return request.get<Api.Common.DataResponse<DictType>>({
      url: '/system/dict/dict/type/optionselect'
    })
  }
}
