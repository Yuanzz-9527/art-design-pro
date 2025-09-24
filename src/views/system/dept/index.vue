<template>
  <div class="dept-page art-full-height">
    <!-- 搜索栏 -->
    <ArtSearchBar
      v-model:filter="formFilters"
      :items="formItems"
      @reset="handleReset"
      @search="handleSearch"
    />

    <ElCard class="art-table-card" shadow="never">
      <!-- 表格头部 -->
      <ArtTableHeader :showZebra="false" v-model:columns="columnChecks" @refresh="handleRefresh">
        <template #left>
          <ElButton v-auth="'system:dept:add'" plain type="primary" @click="handleAdd()" v-ripple>
            添加部门
          </ElButton>
          <ElButton @click="toggleExpand" plain type="info" v-ripple>
            {{ isExpanded ? '收起' : '展开' }}
          </ElButton>
        </template>
      </ArtTableHeader>

      <ArtTable
        ref="tableRef"
        rowKey="deptId"
        :loading="loading"
        :columns="columns"
        :data="tableData"
        :stripe="false"
        :default-expand-all="isExpanded"
      >
        <template #status="{ value }">
          <ArtDict :options="dict.sys_normal_disable" :value="value"></ArtDict>
        </template>
        <template #createTime="{ value }">
          <span>{{ parseTime(value, '{y}-{m}-{d}') }}</span>
        </template>
      </ArtTable>

      <!-- 弹窗表单 -->
      <ElDialog
        :title="dialogTitle"
        v-model="dialogVisible"
        width="700px"
        align-center
        :close-on-click-modal="false"
      >
        <ElForm ref="formRef" :model="form" :rules="rules" label-width="85px">
          <ElRow :gutter="20">
            <ElCol :span="24" v-if="form.parentId !== 0">
              <ElFormItem label="上级部门" prop="parentId">
                <ElTreeSelect
                  v-model="form.parentId"
                  :data="deptOptions"
                  check-strictly
                  node-key="deptId"
                  :props="{ value: 'deptId', label: 'deptName', children: 'children' }"
                  placeholder="请选择上级部门"
                  :render-after-expand="false"
                  :default-expanded-keys="expandedKeys"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="部门名称" prop="deptName">
                <ElInput v-model="form.deptName" placeholder="请输入部门名称"></ElInput>
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="显示顺序" prop="orderNum">
                <ElInputNumber
                  v-model="form.orderNum"
                  style="width: 100%"
                  :min="1"
                  controls-position="right"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="负责人" prop="leader">
                <ElInput v-model="form.leader" placeholder="请输入负责人"></ElInput>
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="联系电话" prop="phone">
                <ElInput v-model="form.phone" placeholder="请输入联系电话"></ElInput>
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="邮箱" prop="email">
                <ElInput v-model="form.email" placeholder="请输入邮箱"></ElInput>
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="部门状态" prop="status">
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
  import { type Dept, DeptService } from '@/api/system/dept'
  import type { FormInstance, FormRules, TreeData } from 'element-plus'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useTableColumns } from '@/composables/useTableColumns'
  import { useAuth } from '@/composables/useAuth'
  import { SearchFormItem } from '@/types'
  import { handleTree, parseTime, validatePhone } from '@/utils'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import useDict from '@/composables/useDict'
  import ArtDict from '@/components/core/forms/art-dict/index.vue'

  defineOptions({ name: 'Depts' })

  const { hasAuth } = useAuth()
  // 字典
  const { dict } = useDict(['sys_normal_disable'])
  const { listDept, addDept, updateDept, getDept, delDept, listDeptExcludeChild } = DeptService

  const loading = ref(false)
  const initialSearchState = {
    deptName: undefined,
    status: undefined
  }
  const formFilters = reactive({ ...initialSearchState })

  const handleReset = () => {
    Object.assign(formFilters, { ...initialSearchState })
    handleSearch()
  }

  const handleRefresh = () => handleSearch()

  // 搜索项配置
  const formItems = computed<SearchFormItem[]>(() => [
    {
      label: '部门名称',
      prop: 'deptName',
      type: 'input',
      config: { clearable: true }
    },
    {
      label: '部门状态',
      prop: 'status',
      type: 'select',
      config: { clearable: true },
      options: dict.sys_normal_disable
    }
  ])
  // 列表项配置
  const { columnChecks, columns } = useTableColumns(() => [
    { label: '部门名称', prop: 'deptName' },
    { label: '显示顺序', prop: 'orderNum', align: 'center' },
    { label: '部门状态', prop: 'status', align: 'center', useSlot: true },
    { label: '负责人', prop: 'leader', align: 'center' },
    { label: '联系电话', prop: 'phone', align: 'center' },
    { label: '邮箱', prop: 'email', align: 'center' },
    { label: '创建时间', prop: 'createTime', align: 'center', useSlot: true },
    {
      prop: 'operation',
      label: '操作',
      width: 180,
      formatter: (row: Dept) => {
        return h('div', [
          hasAuth('system:dept:add') &&
            h(ArtButtonTable, { type: 'add', onClick: () => handleAdd(row) }),
          hasAuth('system:dept:edit') &&
            h(ArtButtonTable, { type: 'edit', onClick: () => handleUpdate(row) }),
          hasAuth('system:dept:delete') &&
            h(ArtButtonTable, { type: 'delete', onClick: () => deleteRow(row) })
        ])
      }
    }
  ])

  const tableData = ref<Dept[]>([])
  const deptOptions = ref<TreeData>([])

  // 搜索
  const handleSearch = async () => {
    loading.value = true
    try {
      const { data } = await listDept(formFilters)
      tableData.value = handleTree(data, { id: 'deptId' })
    } finally {
      loading.value = false
    }
  }

  // 表单项配置
  const dialogVisible = ref(false)
  const isEdit = ref(false)
  const form = reactive<Partial<Dept>>({})
  const formRef = ref<FormInstance>()
  const dialogTitle = computed(() => (isEdit.value ? '编辑部门' : '新增部门'))

  const validatePhoneFun = (rule: any, value: any, callback: any) => {
    if (!value) {
      callback()
    } else {
      if (!validatePhone(value)) {
        callback(new Error('请输入正确的手机号码格式'))
      }
      callback()
    }
  }
  const rules = reactive<FormRules>({
    deptName: [{ required: true, message: '部门名称不能为空', trigger: 'blur' }],
    parentId: [{ required: true, message: '上级部门不能为空', trigger: 'blur' }],
    orderNum: [{ required: true, message: '显示顺序不能为空', trigger: 'blur' }],
    phone: [{ validator: validatePhoneFun, trigger: 'blur' }],
    email: [{ type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }]
  })

  /**
   * 表单提交
   */
  const submitForm = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (valid) {
        try {
          if (!isEdit.value) {
            await addDept(form as Dept)
          } else {
            await updateDept(form as Dept)
          }
          ElMessage.success((isEdit.value ? '编辑' : '新增') + '成功')
          handleSearch()
          dialogVisible.value = false
        } catch {
          //
        }
      }
    })
  }

  /**
   * 新增操作
   */
  const handleAdd = async (row?: Dept) => {
    resetForm()
    await getTreeSelect()
    form.parentId = row ? row.deptId : undefined
    if (row) expandedKeys.value = [form.parentId ?? 0]
    dialogVisible.value = true
  }

  /**
   * 修改操作
   */
  const handleUpdate = async (row: Dept) => {
    resetForm()
    isEdit.value = true
    await getTreeSelect(row)
    const { data } = await getDept(row.deptId)
    Object.assign(form, {
      deptId: data.deptId ?? undefined,
      deptName: data.deptName ?? undefined,
      parentId: data.parentId ?? undefined,
      ancestors: data.ancestors ?? undefined,
      orderNum: data.orderNum ?? undefined,
      leader: data.leader ?? undefined,
      phone: data.phone ?? undefined,
      email: data.email ?? undefined,
      status: data.status ?? '0'
    })
    dialogVisible.value = true
  }

  /**
   * 删除操作
   */
  const deleteRow = async (row: Dept) => {
    try {
      await ElMessageBox.confirm('确定要删除所选项吗？', '提示', { type: 'warning' })
      await delDept(row.deptId)
      ElMessage.success('删除成功')
      handleSearch()
    } catch {
      //
    }
  }

  const expandedKeys = ref<number[]>([])
  /**
   * 查询菜单树形
   */
  const getTreeSelect = async (row?: Dept) => {
    try {
      let treeList = []
      if (isEdit.value && row?.deptId) {
        const { data } = await listDeptExcludeChild(row.deptId)
        treeList = data
      } else {
        const { data } = await listDept()
        treeList = data
      }
      deptOptions.value = handleTree(treeList, { id: 'deptId' })
      expandedKeys.value = [deptOptions.value[0].deptId ?? 0]
    } catch {
      //
    }
  }

  /**
   * 重置表单
   */
  const resetForm = () => {
    formRef.value?.resetFields()
    Object.assign(form, {
      deptId: undefined,
      deptName: undefined,
      parentId: undefined,
      ancestors: undefined,
      orderNum: undefined,
      leader: undefined,
      phone: undefined,
      email: undefined,
      status: '0'
    })
  }

  const isExpanded = ref(true)
  const tableRef = ref()
  // 展开/折叠
  const toggleExpand = () => {
    isExpanded.value = !isExpanded.value
    nextTick(() => {
      if (tableRef.value && tableData.value) {
        const processRows = (rows: Dept[]) => {
          rows.forEach((row) => {
            if (row.children?.length) {
              tableRef.value.elTableRef.toggleRowExpansion(row, isExpanded.value)
              processRows(row.children)
            }
          })
        }
        processRows(tableData.value)
      }
    })
  }

  onMounted(() => {
    handleSearch()
  })
</script>

<style scoped lang="scss">
  .dept-page {
    :deep(.small-btn) {
      height: 30px !important;
      padding: 0 10px !important;
      font-size: 12px !important;
    }
  }
</style>
