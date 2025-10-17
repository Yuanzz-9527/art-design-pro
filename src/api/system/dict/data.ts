import request from '@/utils/http'

export interface DictItem extends Api.Common.RouyiListItem {
  createBy: string
  createTime: string
  cssClass: string
  default: boolean
  dictCode: number
  dictLabel: string
  dictSort: number
  dictType: string
  dictValue: string
  isDefault: 'Y' | 'N'
  listClass: string
  status: '0' | '1' // 0 启用 1 停用
}

export class DictService {
  // 查询字典数据列表
  static listDictData(params: Api.Common.PaginatingSearchParams & Record<string, unknown>) {
    return request.get<Http.ListResponse<DictItem[]>>({
      url: '/system/dict/data/type/list',
      params
    })
  }

  // 查询字典数据详细
  static getDictData(dictCode: number) {
    return request.get<Http.BaseResponse<DictItem>>({
      url: '/system/dict/data/type/' + dictCode
    })
  }

  // 新增字典数据
  static addDictData(params: DictItem) {
    return request.post({
      url: '/system/dict/data/type',
      params
    })
  }

  // 修改字典数据
  static updateDictData(params: DictItem) {
    return request.put({
      url: '/system/dict/data/type',
      params
    })
  }

  // 删除字典数据
  static delDictData(dictCode: number | string) {
    return request.del({
      url: '/system/dict/data/type/' + dictCode
    })
  }

  // 根据字典类型查询字典数据信息
  static getDicts(dictType: string) {
    return request.get<Http.BaseResponse<DictItem[]>>({
      url: `/system/dict/data/type/${dictType}`
    })
  }
}
