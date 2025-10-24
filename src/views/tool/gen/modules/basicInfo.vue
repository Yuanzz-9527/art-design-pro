<template>
  <ElForm ref="basicInfoRef" :model="localInfo" :rules="rules" label-width="150px">
    <ElRow>
      <ElCol :span="12">
        <ElFormItem label="表名称" prop="tableName">
          <ElInput placeholder="请输入仓库名称" v-model="localInfo.tableName" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="表描述" prop="tableComment">
          <ElInput placeholder="请输入" v-model="localInfo.tableComment" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="实体类名称" prop="className">
          <ElInput placeholder="请输入" v-model="localInfo.className" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="作者" prop="functionAuthor">
          <ElInput placeholder="请输入" v-model="localInfo.functionAuthor" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="24">
        <ElFormItem label="备注" prop="remark">
          <ElInput type="textarea" :rows="3" v-model="localInfo.remark"></ElInput>
        </ElFormItem>
      </ElCol>
    </ElRow>
  </ElForm>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import type { GenItem } from '@/api/tool/gen'

  defineOptions({ name: 'BasicInfo' })

  const props = withDefaults(
    defineProps<{
      info: GenItem
    }>(),
    {}
  )

  const basicInfoRef = ref<FormInstance>()
  const rules = computed<FormRules>(() => ({
    tableName: [{ required: true, message: '请输入表名称', trigger: 'blur' }],
    tableComment: [{ required: true, message: '请输入表描述', trigger: 'blur' }],
    className: [{ required: true, message: '请输入实体类名称', trigger: 'blur' }],
    functionAuthor: [{ required: true, message: '请输入作者', trigger: 'blur' }]
  }))

  const emit = defineEmits<{
    (e: 'update:info', value: GenItem): void
  }>()

  const localInfo = computed({
    get: () => props.info,
    set: (value) => emit('update:info', value)
  })

  defineExpose({
    basicInfoRef
  })
</script>
