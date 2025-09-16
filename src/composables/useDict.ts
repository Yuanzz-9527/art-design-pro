import { reactive } from 'vue'
import { DictService } from '@/api/system/dict'

// 全局缓存（内存级）
const dictCache: Record<string, any[]> = {}

export default function useDict(dictKeys: string[], options?: { forceRefresh?: boolean }) {
  // 先把每个 key 初始化为 []
  const dict = reactive<Record<string, any[]>>(Object.fromEntries(dictKeys.map((key) => [key, []])))

  const { forceRefresh = false } = options || {}

  dictKeys.forEach(async (key) => {
    // 使用缓存
    if (!forceRefresh && dictCache[key]) {
      dict[key] = dictCache[key]
      return
    }

    try {
      // 异步请求
      const res = await DictService.getDicts(key)
      const data = res.data.map((item: any) => ({
        text: item.dictLabel,
        label: item.dictLabel,
        value: item.dictValue,
        raw: {
          listClass: item.listClass,
          cssClass: item.cssClass
        }
      }))
      dict[key] = data
      dictCache[key] = data
    } catch (err) {
      console.error(`获取字典 ${key} 失败:`, err)
      dict[key] = [] // 出错也保证是数组
    }
  })

  return { dict }
}
