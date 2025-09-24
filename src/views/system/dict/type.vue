<template>
  <div class="type-page art-full-height">
    <!-- 搜索栏 -->
    <ArtSearchBar
      v-model:filter="formFilters"
      :items="formItems"
      @reset="handleResetSearch()"
      @search="handleSearch()"
    ></ArtSearchBar>

    <ElCard class="art-table-card" shadow="never">
      <!-- 表格头部 -->
      <ArtTableHeader :showZebra="false" v-model:columns="columnChecks" @refresh="refreshAll">
        <template #left>
          <ElButton
            @click="showDialog('add')"
            type="primary"
            plain
            v-ripple
            v-auth="'system:dict:add'"
            >新增</ElButton
          >
          <ElButton
            @click="showDialog('edit')"
            type="success"
            plain
            :disabled="single"
            v-auth="'system:dict:edit'"
            v-ripple
          >
            修改</ElButton
          >
          <ElButton
            @click="deleteRole()"
            type="danger"
            plain
            :disabled="multiple"
            v-auth="'system:dict:remove'"
            v-ripple
          >
            删除</ElButton
          >
          <ElButton
            @click="handleExport()"
            type="warning"
            plain
            v-auth="'system:dict:export'"
            v-ripple
            >导出</ElButton
          >
        </template>
      </ArtTableHeader>

      <!-- 列表数据 -->
      <ArtTable
        :loading="isLoading"
        :data="tableData"
        :columns="columns"
        :pagination="paginationState"
        @selection-change="handleSelectionChange"
        @pagination:size-change="onPageSizeChange"
        @pagination:current-change="onCurrentPageChange"
      >
        <template #status="{ value }">
          <ArtDict :options="dict.sys_normal_disable" :value="value"></ArtDict>
        </template>
        <template #createTime="{ value }">
          <span>{{ parseTime(value, '{y}-{m}-{d}') }}</span>
        </template>
      </ArtTable>

      <!-- 新增/编辑字典类型弹框 -->
      <ElDialog
        :title="dialogTitle"
        v-model="dialogVisible"
        width="500px"
        align-center
        :close-on-click-modal="false"
      >
        <ElForm ref="formRef" :model="form" :rules="rules" label-width="85px">
          <ElRow>
            <ElCol :span="24">
              <ElFormItem label="字典名称" prop="dictName">
                <ElInput v-model="form.dictName" placeholder="请输入字典名称"></ElInput>
              </ElFormItem>
            </ElCol>
            <ElCol :span="24">
              <ElFormItem label="字典类型" prop="dictType">
                <ElInput v-model="form.dictType" placeholder="请输入字典类型"></ElInput>
              </ElFormItem>
            </ElCol>
            <ElCol :span="24">
              <ElFormItem label="状态" prop="status">
                <ElRadioGroup v-model="form.status">
                  <ElRadio
                    v-for="dict in dict.sys_normal_disable"
                    :key="dict.value"
                    :value="dict.value"
                    >{{ dict.label }}</ElRadio
                  >
                </ElRadioGroup>
              </ElFormItem>
            </ElCol>
            <ElCol :span="24">
              <ElFormItem label="备注" prop="remark">
                <ElInput v-model="form.remark" type="textarea" placeholder="请输入内容" />
              </ElFormItem>
            </ElCol>
          </ElRow>
        </ElForm>

        <template #footer>
          <span class="dialog-footer">
            <ElButton @click="dialogVisible = false">取 消</ElButton>
            <ElButton type="primary" @click="submitForm()">确 定</ElButton>
          </span>
        </template>
      </ElDialog>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { type DictType, DictTypeService } from '@/api/system/dict/type'
  import { useTable } from '@/composables/useTable'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { downloadFile } from '@/utils/http'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { ElButton } from 'element-plus'
  import { useAuth } from '@/composables/useAuth'
  import { parseTime } from '@/utils'
  import { SearchFormItem } from '@/types'
  import useDict from '@/composables/useDict'
  import ArtDict from '@/components/core/forms/art-dict/index.vue'

  defineOptions({ name: 'DictType' })

  const { hasAuth } = useAuth()
  // 字典
  const { dict } = useDict(['sys_normal_disable'])
  // 接口
  const { listDictType, addDictType, updateDictType, getDictType, delDictType } = DictTypeService

  // 定义表单搜索初始值
  const initialSearchState = {
    dictName: undefined,
    dictType: undefined,
    status: undefined
  }

  // 搜索项配置
  const formItems = computed<SearchFormItem[]>(() => [
    {
      label: '字典名称',
      prop: 'dictName',
      type: 'input',
      config: { clearable: true }
    },
    {
      label: '状态',
      prop: 'status',
      type: 'select',
      config: { clearable: true },
      options: dict.sys_normal_disable
    }
  ])

  // 响应式表单数据
  const formFilters = reactive({ ...initialSearchState })

  // 重置搜索
  const handleResetSearch = () => {
    Object.assign(formFilters, { ...initialSearchState })
    resetSearch()
  }

  // 搜索处理
  const handleSearch = () => {
    Object.assign(searchState, { ...formFilters })
    searchData()
  }

  // 列表数据构建
  const {
    columns,
    columnChecks,
    tableData,
    isLoading,
    paginationState,
    searchData,
    searchState,
    resetSearch,
    onPageSizeChange,
    onCurrentPageChange,
    refreshAll
  } = useTable<DictType>({
    // 核心配置
    core: {
      apiFn: listDictType,
      apiParams: {
        pageNum: 1,
        pageSize: 10,
        ...initialSearchState
      },
      columnsFactory: () => [
        { type: 'selection' }, // 勾选列
        { label: '字典名称', prop: 'dictName' },
        { label: '字典类型', prop: 'dictType', align: 'center' },
        { label: '状态', prop: 'status', align: 'center', useSlot: true },
        { label: '备注', prop: 'remark', align: 'center' },
        // { label: '创建者', prop: 'createBy', align: 'center' },
        { label: '创建时间', prop: 'createTime', align: 'center', useSlot: true },
        {
          prop: 'operation',
          label: '操作',
          width: 180,
          align: 'center',
          fixed: 'right', // 固定列
          formatter: (row) =>
            h('div', { style: 'display: flex; align-items: center;justify-content: center;' }, [
              hasAuth('system:dict:edit') &&
                h(ArtButtonTable, {
                  type: 'edit',
                  onClick: () => showDialog('edit', row)
                }),
              hasAuth('system:dict:remove') &&
                h(ArtButtonTable, {
                  type: 'delete',
                  onClick: () => deleteRole(row)
                })
            ])
        }
      ]
    }
  })

  // 选中行
  const selectedRows = ref<DictType[]>([])
  const ids = ref<number[]>([])
  const single = ref<boolean>(true)
  const multiple = ref<boolean>(true)

  /**
   * 处理表格行选择变化
   * @param selection 行数据
   */
  const handleSelectionChange = (selection: DictType[]): void => {
    selectedRows.value = selection
    ids.value = selection.map((item) => item.dictId)
    single.value = selection.length !== 1
    multiple.value = !selection.length
  }

  const dialogVisible = ref(false)
  const form = reactive<Partial<DictType>>({})
  const isEdit = ref(false)
  const formRef = ref<FormInstance>()
  const dialogTitle = computed(() => (isEdit.value ? '编辑字典类型' : '新增字典类型'))

  const rules = reactive<FormRules>({
    dictName: [{ required: true, message: '字典名称不能为空', trigger: 'blur' }],
    dictType: [{ required: true, message: '字典类型不能为空', trigger: 'blur' }]
  })

  /**
   * 显示新增/编辑字典类型弹框
   * @param type 弹框类型 add/edit
   * @param row DictType
   */
  const showDialog = async (type: string = 'add', row?: DictType) => {
    try {
      isEdit.value = type === 'edit'
      resetForm() // 重置表单
      const dictId = row?.dictId ? row.dictId : (ids.value as unknown as number)
      if (isEdit.value && dictId) {
        const { data } = await getDictType(dictId)
        Object.assign(form, {
          dictId: data.dictId ?? undefined,
          dictName: data.dictName ?? undefined,
          dictType: data.dictType ?? undefined,
          status: data.status ?? undefined,
          remark: data.remark ?? undefined
        })
      }
      dialogVisible.value = true
    } catch {
      //
    }
  }

  // 提交表单
  const submitForm = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (valid) {
        try {
          if (isEdit.value) {
            await updateDictType(form as DictType)
          } else {
            await addDictType(form as DictType)
          }
          ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
          dialogVisible.value = false
          searchData()
        } catch {
          //
        }
      }
    })
  }

  // 重置字典类型表单
  const resetForm = () => {
    formRef.value?.resetFields()
    Object.assign(form, {
      dictId: undefined,
      dictName: undefined,
      dictType: undefined,
      status: undefined,
      remark: undefined
    })
  }

  /**
   * 删除字典类型
   * @param row 行数据
   */
  const deleteRole = async (row?: DictType | null) => {
    const dictIds: string = row?.dictId ? row.dictId.toString() : ids.value.toString()
    try {
      await ElMessageBox.confirm('确定要删除所选项吗？', '提示', { type: 'warning' })
      await delDictType(dictIds)
      ElMessage.success('删除成功')
      handleSearch()
    } catch {
      //
    }
  }

  /**
   * 导出列表excel
   */
  const handleExport = () => {
    downloadFile(
      'system/dict/type/export',
      { ...searchState },
      '字典类型列表_' + new Date().getTime() + '.xlsx'
    )
  }
</script>

<style lang="scss" scoped></style>
