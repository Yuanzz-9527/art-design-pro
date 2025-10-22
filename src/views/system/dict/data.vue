<template>
  <div class="dict-page art-full-height">
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
            @click="handleRemove()"
            type="danger"
            plain
            :disabled="multiple"
            v-auth="'system:dict:remove'"
            v-ripple
          >
            删除</ElButton
          >
          <ElButton @click="handleClose()" type="warning" plain v-ripple> 关闭</ElButton>
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

      <!-- 新增/编辑字典数据弹框 -->
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
              <ElFormItem label="字典类型" prop="dictType">
                <ElSelect v-model="form.dictType" disabled placeholder="请选择字典类型">
                  <ElOption label="请选择字典生成" value="" />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="24">
              <ElFormItem label="字典标签" prop="dictLabel">
                <ElInput v-model="form.dictLabel" placeholder="请输入字典标签"></ElInput>
              </ElFormItem>
            </ElCol>
            <ElCol :span="24">
              <ElFormItem label="字典键值" prop="dictValue">
                <ElInput v-model="form.dictValue" placeholder="请输入字典键值"></ElInput>
              </ElFormItem>
            </ElCol>
            <ElCol :span="24">
              <ElFormItem label="样式属性" prop="cssClass">
                <ElInput v-model="form.cssClass" placeholder="请输入样式属性"></ElInput>
              </ElFormItem>
            </ElCol>
            <ElCol :span="24">
              <ElFormItem label="字典排序" prop="dictSort">
                <ElInputNumber
                  v-model="form.dictSort"
                  style="width: 100%"
                  :min="1"
                  controls-position="right"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="24">
              <ElFormItem label="回显样式" prop="listClass">
                <ElInput v-model="form.listClass" placeholder="请输入表格回显样式"></ElInput>
              </ElFormItem>
            </ElCol>
            <!-- <ElCol :span="24">
              <ElFormItem label="是否默认" prop="isDefault">
                <ElInput v-model="form.isDefault" placeholder="请输入是否默认"></ElInput>
              </ElFormItem>
            </ElCol> -->
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
                <ElInput v-model="form.remark" :rows="3" type="textarea" placeholder="请输入内容" />
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
  import { type DictItem, DictService } from '@/api/system/dict/data'
  import { DictTypeService } from '@/api/system/dict/type'
  import { useTable } from '@/composables/useTable'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { ElButton } from 'element-plus'
  import { useAuth } from '@/composables/useAuth'
  import { parseTime } from '@/utils'
  import { SearchFormItem, SearchChangeParams } from '@/types'
  import useDict from '@/composables/useDict'
  import ArtDict from '@/components/core/forms/art-dict/index.vue'
  import { useRoute } from 'vue-router'
  import { useWorktabStore } from '@/store/modules/worktab'

  defineOptions({ name: 'DictData' })

  const { hasAuth } = useAuth()
  // 字典
  const { dict } = useDict(['sys_normal_disable'])
  // 接口
  const { listDictData, addDictData, updateDictData, getDictData, delDictData } = DictService
  const { optionselect, getDictType } = DictTypeService
  const route = useRoute()
  const worktabStore = useWorktabStore()

  // 定义表单搜索初始值
  const initialSearchState: {
    dictLabel?: string
    dictValue?: string
    dictType?: string
    status?: string | number
  } = {
    dictLabel: undefined,
    dictValue: undefined,
    dictType: undefined,
    status: undefined
  }

  // 搜索项配置
  const formItems = computed<SearchFormItem[]>(() => [
    {
      label: '字典名称',
      prop: 'dictType',
      type: 'select',
      config: { clearable: false },
      options: dictOptions.value,
      onChange: handleFormChange
    },
    {
      label: '字典标签',
      prop: 'dictLabel',
      type: 'input',
      config: { clearable: true }
    },
    {
      label: '状态',
      prop: 'status',
      type: 'select',
      config: { clearable: true },
      options: dict.sys_normal_disable,
      onChange: handleFormChange
    }
  ])

  // 响应式表单数据
  const formFilters = reactive({ ...initialSearchState })

  // 重置搜索
  const handleResetSearch = () => {
    Object.assign(formFilters, { ...initialSearchState })
    Object.assign(searchState, { ...formFilters })
    searchData()
  }

  // 搜索处理
  const handleSearch = () => {
    Object.assign(searchState, { ...formFilters })
    searchData()
  }
  const handleFormChange = (params: SearchChangeParams): void => {
    console.log('表单项变更:', params)
    handleSearch()
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
    onPageSizeChange,
    onCurrentPageChange,
    refreshAll
  } = useTable<DictItem>({
    // 核心配置
    core: {
      apiFn: listDictData,
      apiParams: {
        pageNum: 1,
        pageSize: 10,
        ...initialSearchState
      },
      immediate: false,
      columnsFactory: () => [
        { type: 'selection' }, // 勾选列
        { label: '字典标签', prop: 'dictLabel', align: 'center' },
        { label: '字典键值', prop: 'dictValue', align: 'center' },
        // { label: '字典类型', prop: 'dictType', align: 'center' },
        { label: '样式属性', prop: 'cssClass', align: 'center' },
        { label: '回显样式', prop: 'listClass', align: 'center' },
        // { label: '是否默认', prop: 'isDefault', align: 'center' },
        { label: '字典排序', prop: 'dictSort', align: 'center' },
        { label: '状态', prop: 'status', align: 'center', useSlot: true },
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
                  onClick: () => handleRemove(row)
                })
            ])
        }
      ]
    }
  })

  // 选中行
  const selectedRows = ref<DictItem[]>([])
  const ids = ref<number[]>([])
  const single = ref<boolean>(true)
  const multiple = ref<boolean>(true)

  const dictOptions = ref<{ label: string; value: string }[]>([])
  /**
   * 获取下拉数据，对应字典详情
   */
  const getDictSelect = async () => {
    try {
      const { data } = await optionselect()
      dictOptions.value = data.map((item) => {
        return { value: item.dictType, label: item.dictName ?? '' }
      })
      const id = route.params.dictId as string
      const { data: dictData } = await getDictType(id)
      initialSearchState.dictType = dictData.dictType
      Object.assign(formFilters, { ...initialSearchState })
      Object.assign(searchState, { ...formFilters })
      searchData()
    } catch {
      //
    }
  }
  getDictSelect()

  /**
   * 处理表格行选择变化
   * @param selection 行数据
   */
  const handleSelectionChange = (selection: DictItem[]): void => {
    selectedRows.value = selection
    ids.value = selection.map((item) => item.dictCode)
    single.value = selection.length !== 1
    multiple.value = !selection.length
  }

  const dialogVisible = ref(false)
  const form = reactive<Partial<DictItem>>({})
  const isEdit = ref(false)
  const formRef = ref<FormInstance>()
  const dialogTitle = computed(() => (isEdit.value ? '编辑字典数据' : '新增字典数据'))

  const rules = reactive<FormRules>({
    dictType: [{ required: true, message: '字典类型不能为空', trigger: 'change' }],
    dictLabel: [{ required: true, message: '字典标签不能为空', trigger: 'blur' }],
    dictValue: [{ required: true, message: '字典键值不能为空', trigger: 'blur' }],
    dictSort: [{ required: true, message: '字典排序不能为空', trigger: 'blur' }]
  })

  /**
   * 显示新增/编辑字典数据弹框
   * @param type 弹框类型 add/edit
   * @param row DictItem
   */
  const showDialog = async (type: string = 'add', row?: DictItem) => {
    try {
      isEdit.value = type === 'edit'
      resetForm() // 重置表单
      const dictCode = row?.dictCode ? row.dictCode : (ids.value as unknown as number)
      if (isEdit.value && dictCode) {
        const { data } = await getDictData(dictCode)
        Object.assign(form, {
          dictCode: data.dictCode ?? undefined,
          dictSort: data.dictSort ?? 1,
          dictLabel: data.dictLabel ?? undefined,
          dictValue: data.dictValue ?? undefined,
          dictType: data.dictType ?? undefined,
          cssClass: data.cssClass ?? undefined,
          listClass: data.listClass ?? undefined,
          // isDefault: data.isDefault ?? undefined,
          status: data.status ?? '0',
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
            await updateDictData(form as DictItem)
          } else {
            await addDictData(form as DictItem)
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

  // 重置字典数据表单
  const resetForm = () => {
    formRef.value?.resetFields()
    Object.assign(form, {
      dictCode: undefined,
      dictSort: 1,
      dictLabel: undefined,
      dictValue: undefined,
      dictType: formFilters.dictType,
      cssClass: undefined,
      listClass: undefined,
      // isDefault: undefined,
      status: '0',
      remark: undefined
    })
  }

  /**
   * 删除字典数据
   * @param row 行数据
   */
  const handleRemove = async (row?: DictItem | null) => {
    const dictCodes: string = row?.dictCode ? row.dictCode.toString() : ids.value.toString()
    try {
      await ElMessageBox.confirm('确定要删除所选项吗？', '提示', { type: 'warning' })
      await delDictData(dictCodes)
      ElMessage.success('删除成功')
      handleSearch()
    } catch {
      //
    }
  }

  /**
   * 关闭当前页面
   */
  const handleClose = () => {
    worktabStore.removeTab(route.path)
  }
</script>

<style lang="scss" scoped></style>
