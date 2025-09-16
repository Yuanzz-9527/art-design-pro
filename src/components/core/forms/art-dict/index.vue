<template>
  <div>
    <template v-for="item in options" :key="item.value">
      <template v-if="values.includes(String(item.value))">
        <span
          v-if="(item.raw.listClass === 'default' || !item.raw.listClass) && !item.raw.cssClass"
          :class="item.raw.cssClass"
        >
          {{ item.label + ' ' }}
        </span>
        <ElTag
          v-else
          :disable-transitions="true"
          :type="
            ['primary', 'success', 'warning', 'info', 'danger'].includes(
              item.raw.listClass as string
            )
              ? (item.raw.listClass as 'primary' | 'success' | 'warning' | 'info' | 'danger')
              : undefined
          "
          :class="item.raw.cssClass"
        >
          {{ item.label + ' ' }}
        </ElTag>
      </template>
    </template>

    <!-- 未匹配项 -->
    <template v-if="unmatch && showValue">
      {{ handleArray(unmatchArray) }}
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'

  defineOptions({ name: 'ArtDict' })

  interface DictOption {
    label: string
    value: string | number
    raw: {
      listClass?: 'primary' | 'success' | 'warning' | 'info' | 'danger' | string
      cssClass?: string
    }
  }

  const props = defineProps<{
    options: DictOption[]
    value?: string | number | Array<string | number> | null
    showValue?: boolean
    separator?: string
  }>()

  const showValue = props.showValue ?? true
  const separator = props.separator ?? ','

  // 未匹配数组
  const unmatchArray = ref<string[]>([])

  // 标准化 value -> string[]
  const values = computed(() => {
    if (props.value == null || props.value === '') return []
    return Array.isArray(props.value)
      ? props.value.map((item) => String(item))
      : String(props.value).split(separator)
  })

  // 计算未匹配项
  const unmatch = computed(() => {
    if (props.value == null || props.value === '' || props.options.length === 0) return false

    let hasUnmatch = false
    const unmatched: string[] = []
    values.value.forEach((item) => {
      if (!props.options.some((v) => String(v.value) === item)) {
        unmatched.push(item)
        hasUnmatch = true
      }
    })
    return hasUnmatch
  })

  // 监听 values 变化，更新 unmatchArray
  watch(
    values,
    (newValues) => {
      const unmatched: string[] = []
      if (props.value == null || props.value === '' || props.options.length === 0) {
        unmatchArray.value = []
        return
      }
      newValues.forEach((item) => {
        if (!props.options.some((v) => String(v.value) === item)) {
          unmatched.push(item)
        }
      })
      unmatchArray.value = unmatched
    },
    { immediate: true }
  )

  // 替代 filter 的方法
  function handleArray(array: string[]): string {
    if (array.length === 0) return ''
    return array.join(' ')
  }
</script>

<style scoped>
  .el-tag + .el-tag {
    margin-left: 10px;
  }
</style>
