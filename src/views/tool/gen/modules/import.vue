<template>
  <!-- 创建 -->
  <ElDialog
    title="导入表"
    v-model="visible"
    width="900px"
    align-center
    :close-on-click-modal="false"
  >
    <div class="gen-import-page">
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
          <template #left> </template>
        </ArtTableHeader>

        <!-- 列表数据 -->
        <ArtTable
          :loading="isLoading"
          :data="tableData"
          height="400px"
          :columns="columns"
          :pagination="paginationState"
          @selection-change="handleSelectionChange"
          @pagination:size-change="onPageSizeChange"
          @pagination:current-change="onCurrentPageChange"
        >
        </ArtTable>
      </ElCard>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <ElButton @click="visible = false">取 消</ElButton>
        <ElButton type="primary" @click="submitForm()">确 定</ElButton>
      </span>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { type GenItem, GenService } from '@/api/tool/gen'
  import { useTable } from '@/composables/useTable'
  import { SearchFormItem } from '@/types'
  import { ApiStatus } from '@/utils/http/status'

  defineOptions({ name: 'GenImport' })
  const emit = defineEmits<{
    (e: 'ok'): void // 主按钮点击事件
  }>()

  // 接口
  const { listDbTable, importTable } = GenService

  // 弹框显示
  const visible = ref(false)
  const open = async () => {
    try {
      searchData()
      visible.value = true
    } catch {
      //error
    }
  }

  // 定义表单搜索初始值
  const initialSearchState = {
    tableName: undefined,
    tableComment: undefined
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
  } = useTable<GenItem>({
    // 核心配置
    core: {
      apiFn: listDbTable,
      apiParams: {
        pageNum: 1,
        pageSize: 10,
        ...initialSearchState
      },
      immediate: false,
      columnsFactory: () => [
        { type: 'selection' }, // 勾选列
        { label: '表名称', prop: 'tableName' },
        { label: '表描述', prop: 'tableComment', align: 'center' },
        { label: '创建时间', prop: 'createTime', align: 'center' },
        { label: '更新时间', prop: 'updateTime', align: 'center' }
      ]
    },
    performance: {
      enableCache: false //开启缓存
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

  // 提交表单
  const submitForm = async () => {
    const tbNames = tableNames.value.join(',')
    if (!tbNames) return ElMessage.warning('请选择需要导入的表')
    try {
      const { code } = await importTable({ tables: tbNames })
      if (code === ApiStatus.success) {
        visible.value = false
        ElMessage.success('导入成功')
        emit('ok')
      }
    } catch {
      //
    }
  }

  defineExpose({
    open
  })
</script>

<style lang="scss" scoped></style>
