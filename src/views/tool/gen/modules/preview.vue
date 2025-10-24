<template>
  <ElDialog
    :title="title"
    v-model:model-value="visible"
    width="80%"
    align-center
    destroy-on-close
    :close-on-click-modal="false"
  >
    <el-tabs v-model="activeName" type="card">
      <el-tab-pane :label="item.name" :name="item.name" v-for="item in tabOptions" :key="item.name">
        <div class="my-full-height">
          <CodeEditor
            v-model:value="item.content"
            :language="item.language"
            :theme="theme"
            :options="editorOptions"
          ></CodeEditor>
        </div>
      </el-tab-pane>
    </el-tabs>
  </ElDialog>
</template>

<script setup lang="ts">
  import { CodeEditor } from 'monaco-editor-vue3'
  import { useSettingStore } from '@/store/modules/setting'
  defineOptions({ name: 'CodePreviewDialog' })

  const settingStore = useSettingStore()

  const editorOptions = {
    fontSize: 14,
    minimap: { enabled: false },
    automaticLayout: true,
    readonly: true
  }
  interface PreviewProps {
    modelValue: boolean
    title?: string
    mvData?: Record<string, string>
    activeName: string
  }

  const props = withDefaults(defineProps<PreviewProps>(), {
    modelValue: false,
    title: '代码预览',
    mvData: () => {
      return {}
    },
    activeName: ''
  })

  const emit = defineEmits(['update:modelValue', 'update:activeName'])

  // ✅ 用 computed 双向绑定替代 watch
  const visible = computed({
    get: () => props.modelValue,
    set: (val: boolean) => emit('update:modelValue', val)
  })

  // 双向绑定 activeName prop，避免直接修改 prop
  const activeName = computed({
    get: () => props.activeName,
    set: (val: string) => emit('update:activeName', val)
  })

  // 主题
  const theme = computed(() => {
    const typeMap: Record<string, string> = {
      dark: 'vs-dark',
      light: 'vs'
    }
    return typeMap[settingStore.systemThemeType]
  })

  const tabOptions = computed(() => {
    const vms = []
    for (const key in props.mvData) {
      const { type, name } = parseFile(key)
      let vm = {
        language: type,
        name,
        content: props.mvData[key]
      }
      vms.push(vm)
    }
    return vms
  })

  const parseFile = (path: string) => {
    const parts = path.split('/')
    const fullName = parts.pop() || ''
    const name = fullName.replace(/\.vm$/, '') // 去掉 .vm
    const typeRaw = parts[parts.length - 1] || ''
    let type = typeRaw

    // 扩展映射关系
    const typeMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      java: 'java',
      vue: 'javascript',
      xml: 'xml',
      sql: 'sql'
    }

    type = typeMap[typeRaw] || typeRaw
    return { type, name }
  }
</script>

<style lang="scss" scoped>
  .my-full-height {
    position: relative;
    width: 100%;
    height: calc(var(--art-full-height) - 200px);
  }
</style>
