<template>
  <div class="gen-page art-full-height">
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
            @click="handleGenTable()"
            type="primary"
            plain
            v-ripple
            :disabled="multiple"
            v-auth="'tool:gen:code'"
            >生成
          </ElButton>
          <ElButton
            @click="handleCreateTable()"
            type="primary"
            plain
            v-ripple
            v-auth="'tool:gen:code'"
            >创建
          </ElButton>
          <ElButton @click="handleImport()" type="info" plain v-auth="'tool:gen:import'" v-ripple>
            导入
          </ElButton>
          <ElButton
            @click="handleUpdate()"
            type="success"
            plain
            :disabled="single"
            v-auth="'tool:gen:edit'"
            v-ripple
          >
            修改
          </ElButton>
          <ElButton
            @click="handleRemove()"
            type="danger"
            plain
            :disabled="multiple"
            v-auth="'tool:gen:remove'"
            v-ripple
          >
            删除
          </ElButton>
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
      </ArtTable>

      <!-- 创建 -->
      <ElDialog
        :title="dialogTitle"
        v-model="dialogVisible"
        width="700px"
        align-center
        :close-on-click-modal="false"
      >
        <ElForm ref="formRef" :model="form" :rules="rules" label-width="85px" label-position="top">
          <ElRow>
            <ElCol :span="24">
              <ElFormItem label="创建表语句(支持多个建表语句):" prop="sql">
                <ElInput
                  v-model="form.sql"
                  type="textarea"
                  :rows="14"
                  placeholder="请输入sql语句"
                ></ElInput>
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

      <!-- 代码预览 -->
      <CodePreview
        v-model:model-value="preview.open"
        :mv-data="preview.data"
        :activeName="preview.activeName"
      ></CodePreview>

      <!-- 导入表 -->
      <Import ref="tableImportRef" @ok="searchData"></Import>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { type GenItem, GenService } from '@/api/tool/gen'
  import { useTable } from '@/composables/useTable'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElButton, ElMessage, ElMessageBox } from 'element-plus'
  import { useAuth } from '@/composables/useAuth'
  import { SearchFormItem } from '@/types'
  import CodePreview from './modules/preview.vue'
  import downloadApi from '@/utils/http/download'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import Import from './modules/import.vue'
  import { useRouter } from 'vue-router'

  defineOptions({ name: 'GenItem' })

  const { hasAuth } = useAuth()
  const router = useRouter()
  // 接口
  const { listTable, synchDb, genCode, createTable, delTable, previewTable } = GenService

  // 定义表单搜索初始值
  const initialSearchState = {
    tableName: undefined,
    tableComment: undefined,
    daterange: [],
    orderByColumn: undefined,
    isAsc: undefined
  }

  // 搜索项配置
  const formItems = computed<SearchFormItem[]>(() => [
    {
      label: '表名称',
      prop: 'tableName',
      type: 'input',
      config: { clearable: true }
    },
    {
      label: '表描述',
      prop: 'tableComment',
      type: 'input',
      config: { clearable: true }
    },
    {
      label: '创建时间',
      prop: 'daterange',
      type: 'daterange',
      config: {
        type: 'daterange',
        startPlaceholder: '开始时间',
        endPlaceholder: '结束时间'
      }
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
    const { daterange, ...searchParams } = formFilters
    if (Array.isArray(daterange) && daterange[0] && daterange[1]) {
      const [beginTime, endTime] = daterange
      // 搜索参数赋值
      Object.assign(searchState, { ...searchParams, params: { beginTime, endTime } })
    } else {
      Object.assign(searchState, { ...searchParams })
    }
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
  } = useTable<GenItem>({
    // 核心配置
    core: {
      apiFn: listTable,
      apiParams: {
        pageNum: 1,
        pageSize: 10,
        ...initialSearchState
      },
      columnsFactory: () => [
        { type: 'selection' }, // 勾选列
        { type: 'index' }, // 序号列
        { label: '表名称', prop: 'tableName' },
        { label: '表描述', prop: 'tableComment', align: 'center' },
        { label: '实体', prop: 'className', align: 'center' },
        { label: '创建时间', prop: 'createTime', align: 'center', sortable: true },
        { label: '更新时间', prop: 'updateTime', align: 'center', sortable: true },
        {
          prop: 'operation',
          label: '操作',
          width: 220,
          align: 'center',
          fixed: 'right', // 固定列
          formatter: (row) =>
            h('div', { style: 'display: flex; align-items: center;justify-content: center;' }, [
              hasAuth('tool:gen:preview') &&
                h(ArtButtonTable, {
                  type: 'view',
                  onClick: () => handlePreview(row)
                }),
              hasAuth('tool:gen:edit') &&
                h(ArtButtonTable, {
                  type: 'edit',
                  onClick: () => handleUpdate(row)
                }),
              hasAuth('tool:gen:remove') &&
                h(ArtButtonTable, {
                  type: 'delete',
                  onClick: () => handleRemove(row)
                }),
              hasAuth('tool:gen:edit') &&
                h(ArtButtonTable, {
                  type: 'sync',
                  onClick: () => handleSyncDb(row)
                }),
              hasAuth('tool:gen:code') &&
                h(ArtButtonTable, {
                  type: 'download',
                  onClick: () => handleGenTable(row)
                })
            ])
        }
      ]
    },
    performance: {
      enableCache: true //开启缓存
    }
  })

  // 选中行
  const selectedRows = ref<GenItem[]>([])
  const ids = ref<number[]>([])
  const tableNames = ref<string[]>([])
  const single = ref<boolean>(true)
  const multiple = ref<boolean>(true)

  /**
   * 处理表格行选择变化
   * @param selection 行数据
   */
  const handleSelectionChange = (selection: GenItem[]): void => {
    selectedRows.value = selection
    ids.value = selection.map((item) => item.tableId)
    tableNames.value = selection.map((item) => item.tableName)
    single.value = selection.length !== 1
    multiple.value = !selection.length
  }

  const dialogVisible = ref(false)
  const form = reactive<{ sql: string }>({
    sql: ''
  })
  const formRef = ref<FormInstance>()
  const dialogTitle = ref('')

  const rules = reactive<FormRules>({
    dictName: [{ required: true, message: '字典名称不能为空', trigger: 'blur' }],
    dictType: [{ required: true, message: '字典类型不能为空', trigger: 'blur' }]
  })

  /**
   * 显示新增/编辑字典类型弹框
   * @param type 弹框类型 add/edit
   * @param row GenItem
   */
  const handleUpdate = async (row?: GenItem) => {
    try {
      const tableId = row?.tableId ? row.tableId : ids.value[0]
      await router.push({ name: 'ToolGenEdit', params: { tableId } })
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
          await createTable(form)
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
      sql: ''
    })
  }

  /**
   * 删除字典类型
   * @param row 行数据
   */
  const handleRemove = async (row?: GenItem | null) => {
    const tableIds: string = row?.tableId ? row.tableId.toString() : ids.value.toString()
    try {
      await ElMessageBox.confirm('确定要删除所选项吗？', '提示', { type: 'warning' })
      await delTable(tableIds)
      ElMessage.success('删除成功')
      handleSearch()
    } catch {
      //
    }
  }

  const preview = reactive({
    data: {},
    open: false,
    activeName: 'domain.java'
  })
  /**
   * 预览按钮
   * */
  const handlePreview = (row: GenItem) => {
    previewTable(row.tableId).then((response) => {
      preview.data = response.data
      preview.open = true
      preview.activeName = 'domain.java'
    })
  }

  /**
   * 同步数据库操作
   * */
  const handleSyncDb = async (row: GenItem) => {
    const tableName = row.tableName
    try {
      await ElMessageBox.confirm('确认要强制同步"' + tableName + '"表结构吗？', '提示', {
        type: 'warning'
      })
      await synchDb(tableName)
      ElMessage.success('同步成功')
    } catch {
      //
    }
  }

  /**
   * 生成代码
   *
   */
  const handleGenTable = async (row?: GenItem) => {
    const tbNames = row?.tableName || (tableNames.value ? tableNames.value.toString() : '')
    if (tbNames == '') {
      ElMessage.error('请选择要生成的数据')
      return
    }
    try {
      if (row?.genType === '1') {
        await genCode(row.tableName)
        ElMessage.success('成功生成到自定义路径：' + row.genPath)
      } else {
        downloadApi.zip('/tool/gen/batchGenCode?tables=' + tbNames, 'ruoyi.zip')
      }
    } catch {
      //
    }
  }

  /**
   * 创建表
   */
  const handleCreateTable = () => {
    resetForm()
    dialogTitle.value = '创建表'
    dialogVisible.value = true
  }

  const tableImportRef = ref<InstanceType<typeof Import> | null>(null)
  /**
   * 导入表
   */
  const handleImport = () => {
    if (!tableImportRef.value) return
    tableImportRef.value.open()
  }
</script>

<style lang="scss" scoped></style>
