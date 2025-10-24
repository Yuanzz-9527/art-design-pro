import request from '@/utils/http'

export interface GenItem extends Api.Common.RouyiListItem {
  businessName: string
  className: string
  crud: boolean
  functionAuthor: string
  functionName: string
  genPath: string
  genType: '0' | '1' // 0=zip压缩包, 1=自定义路径
  moduleName: string
  options: string
  packageName: string
  parentMenuId: number | null
  parentMenuName: string | null
  pkColumn: string | null
  sub: boolean
  subTable: string | null
  subTableFkName: string
  subTableName: string
  tableComment: string
  tableId: number
  tableName: string
  tplCategory: 'crud' | 'tree' | 'sub' // 模板类型
  tplWebType: 'element-plus' | 'naive-ui' | 'antd-vue' | string
  tree: boolean
  treeCode: string
  treeName: string
  treeParentCode: string
  columns: GenTableColumn[]
}

export interface GenTableColumn {
  columnId: number
  tableId: number
  columnName: string
  columnComment: string
  columnType: string
  javaType: 'Long' | 'String' | 'Integer' | 'Double' | 'BigDecimal' | 'Date' | 'Boolean' | string
  javaField: string

  isPk: '0' | '1'
  isIncrement: '0' | '1'
  isRequired: '0' | '1'
  isInsert: '0' | '1'
  isEdit: '0' | '1'
  isList: '0' | '1'
  isQuery: '0' | '1'
  queryType: 'EQ' | 'NE' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'LIKE' | 'BETWEEN' | string
  htmlType:
    | 'input'
    | 'textarea'
    | 'select'
    | 'radio'
    | 'checkbox'
    | 'datetime'
    | 'imageUpload'
    | 'fileUpload'
    | 'editor'
    | string
  dictType: string
  sort: number

  /** 前端扩展属性 */
  required: boolean
  list: boolean
  insert: boolean
  pk: boolean
  usableColumn: boolean
  superColumn: boolean
  edit: boolean
  query: boolean
  capJavaField: string
  increment: boolean
}

export interface GenInfo {
  info: GenItem
  rows: GenTableColumn[]
  tables: GenItem[]
}

export interface SearchParams {
  tableName?: string
  tableComment?: string
  params?: {
    beginTime: string
    endTime: string
  }
  orderByColumn?: string
  isAsc?: string
}

export class GenService {
  // 查询生成表数据
  static listTable(params: Api.Common.PaginatingSearchParams & SearchParams) {
    return request.get<Http.ListResponse<GenItem>>({
      url: '/tool/gen/list',
      params
    })
  }
  // 查询db数据库列表
  static listDbTable(params: Api.Common.PaginatingSearchParams & SearchParams) {
    return request.get<Http.ListResponse<GenItem>>({
      url: '/tool/gen/db/list',
      params
    })
  }

  // 查询表详细信息
  static getGenTable(tableId: number) {
    return request.get<Http.BaseResponse<GenInfo>>({
      url: '/tool/gen/' + tableId
    })
  }

  // 修改代码生成信息
  static updateGenTable(params: GenItem) {
    return request.put({
      url: '/tool/gen',
      params
    })
  }

  // 导入表
  static importTable(params: { tables: string }) {
    return request.post<Http.BaseResponse<any>>({
      url: '/tool/gen/importTable',
      isParams: true,
      params
    })
  }

  // 创建表
  static createTable(params: { sql: string }) {
    return request.post({
      url: '/tool/gen/createTable',
      isParams: true,
      params
    })
  }

  // 预览生成代码
  static previewTable(tableId: number) {
    return request.get<Http.BaseResponse<Record<string, string>>>({
      url: '/tool/gen/preview/' + tableId
    })
  }

  // 删除表数据
  static delTable(tableIds: string) {
    return request.del({
      url: '/tool/gen/' + tableIds
    })
  }

  // 生成代码（自定义路径）
  static genCode(tableName: string) {
    return request.get({
      url: '/tool/gen/genCode/' + tableName
    })
  }

  // 同步数据库
  static synchDb(tableName: string) {
    return request.get({
      url: '/tool/gen/synchDb/' + tableName
    })
  }
}
