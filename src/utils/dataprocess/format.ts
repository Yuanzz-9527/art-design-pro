/**
 * 数据格式化相关工具函数
 */

// 时间戳转时间
export function timestampToTime(timestamp: number = Date.now(), isMs: boolean = true): string {
  const date = new Date(isMs ? timestamp : timestamp * 1000)
  return date.toISOString().replace('T', ' ').slice(0, 19)
}

// 数字格式化（千位分隔符）
export function commafy(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 生成随机数
export function randomNum(min: number, max?: number): number {
  if (max === undefined) {
    max = min
    min = 0
  }
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 移除HTML标签
export function removeHtmlTags(str: string = ''): string {
  return str.replace(/<[^>]*>/g, '')
}

/**
 * 请求参数处理
 * @param {*} params  参数
 */
export function tansParams(params: Record<string, any>): string {
  let result = ''
  for (const propName of Object.keys(params)) {
    const value = params[propName]
    const part = encodeURIComponent(propName) + '='
    if (value !== null && value !== '' && typeof value !== 'undefined') {
      if (typeof value === 'object') {
        for (const key of Object.keys(value)) {
          if (value[key] !== null && value[key] !== '' && typeof value[key] !== 'undefined') {
            const params = propName + '[' + key + ']'
            const subPart = encodeURIComponent(params) + '='
            result += subPart + encodeURIComponent(value[key]) + '&'
          }
        }
      } else {
        result += part + encodeURIComponent(value) + '&'
      }
    }
  }
  return result
}

// 定义可选配置类型
interface HandleTreeConfig {
  id?: string
  parentId?: string
  children?: string
}
/**
 * 构造树型结构数据
 * @param {*} data 数据源
 * @param {*} id id字段 默认 'id'
 * @param {*} parentId 父节点字段 默认 'parentId'
 * @param {*} children 孩子节点字段 默认 'children'
 */
export function handleTree<T extends Record<string, any>>(
  data: T[],
  config: HandleTreeConfig = {}
): T[] {
  const cfg = {
    id: config.id ?? 'id',
    parentId: config.parentId ?? 'parentId',
    children: config.children ?? 'children'
  }

  const childrenListMap: Record<string | number, T> = {}
  const tree: T[] = []

  for (const item of data) {
    const itemId = item[cfg.id]
    childrenListMap[itemId] = item

    // 确保 children 存在
    if (!item[cfg.children]) {
      ;(item as any)[cfg.children] = []
    }
  }

  for (const item of data) {
    const parentId = item[cfg.parentId]
    const parentObj = childrenListMap[parentId]

    if (!parentObj) {
      tree.push(item)
    } else {
      ;(parentObj[cfg.children] as T[]).push(item)
    }
  }

  return tree
}

/**
 * 处理时间
 * @param time 时间 string | number | Date | null
 * @param pattern 格式 默认“{y}-{m}-{d} {h}:{i}:{s}”
 * @returns
 */
export function parseTime(
  time?: string | number | Date | null,
  pattern: string = '{y}-{m}-{d} {h}:{i}:{s}'
): string | null {
  if (!time) {
    return null
  }

  let date: Date
  if (time instanceof Date) {
    date = time
  } else {
    if (typeof time === 'string' && /^[0-9]+$/.test(time)) {
      time = parseInt(time)
    } else if (typeof time === 'string') {
      time = time
        .replace(/-/g, '/')
        .replace('T', ' ')
        .replace(/\.[\d]{3}/, '')
    }

    if (typeof time === 'number' && time.toString().length === 10) {
      time = time * 1000
    }
    date = new Date(time)
  }

  const formatObj: Record<string, number> = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay()
  }

  const timeStr = pattern.replace(/{(y|m|d|h|i|s|a)+}/g, (_result, key: string) => {
    let value = formatObj[key]
    // 星期处理
    if (key === 'a') {
      return ['日', '一', '二', '三', '四', '五', '六'][value]
    }
    if (_result.length > 0 && value < 10) {
      value = Number('0' + value)
    }
    return String(value).padStart(2, '0')
  })

  return timeStr
}

/**
 * 将 params 中的 daterange 字段转换为 beginXXX / endXXX
 *
 * @param params 原始参数对象
 * @param propName 可选，字符串或字符串数组，表示需要处理的字段
 * @returns 转换后的参数对象
 */
export function addDateRange<T extends Record<string, any>>(
  params: T,
  propName?: string | string[]
): T {
  const search: T & { params: Record<string, any> } = {
    ...params,
    params:
      typeof params.params === 'object' && params.params !== null && !Array.isArray(params.params)
        ? params.params
        : {}
  }

  // 处理单个字段
  const handleField = (name?: string) => {
    const key = `daterange${name || ''}`
    const range = Array.isArray(params[key]) ? params[key] : [null, null]
    search.params[`begin${name || 'Time'}`] = range[0]
    search.params[`end${name || 'Time'}`] = range[1]
    // 删除原始的 daterange 字段
    delete (search as any)[key]
  }

  if (typeof propName === 'undefined') {
    // 默认处理 "daterangeTime"
    handleField()
  } else if (typeof propName === 'string') {
    handleField(propName)
  } else if (Array.isArray(propName)) {
    for (const name of propName) {
      handleField(name)
    }
  }

  return search
}
