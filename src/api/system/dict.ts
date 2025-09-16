import request from '@/utils/http'

export interface DictItem {
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
  listClass: unknown
  status: '0' | '1' // 0 启用 1 停用
}

export class DictService {
  // 根据字典类型查询字典数据信息
  static getDicts(dictType: string) {
    return request.get<Api.Common.DataResponse<DictItem[]>>({
      url: `/system/dict/data/type/${dictType}`
    })
  }
}
