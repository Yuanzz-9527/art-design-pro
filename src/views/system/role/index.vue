<!-- 角色管理 -->
<template>
  <div class="role-page art-full-height">
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
            v-auth="['system:role:add']"
            >新增</ElButton
          >
          <ElButton
            @click="showDialog('edit')"
            type="success"
            plain
            :disabled="single"
            v-auth="'system:role:edit'"
            v-ripple
          >
            修改</ElButton
          >
          <ElButton
            @click="deleteRole()"
            type="danger"
            plain
            :disabled="multiple"
            v-auth="'system:role:remove'"
            v-ripple
          >
            删除</ElButton
          >
          <ElButton
            @click="handleExport()"
            type="warning"
            plain
            v-auth="'system:role:export'"
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
        <template #status="{ row }">
          <ElSwitch
            v-model="row.status"
            active-value="0"
            inactive-value="1"
            :disabled="row.admin"
            @change="() => handleChangeStatus(row)"
          ></ElSwitch>
        </template>
      </ArtTable>

      <!-- 新增/编辑角色弹框 -->
      <ElDialog
        :title="`${isEdit ? '编辑' : '新增'}角色`"
        v-model="dialogVisible"
        width="500px"
        align-center
      >
        <ElForm ref="formRef" :model="form" :rules="rules" label-width="85px">
          <ElRow>
            <ElCol :span="24">
              <ElFormItem label="角色名称" prop="roleName">
                <ElInput v-model="form.roleName" placeholder="请输入角色名称" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="24">
              <ElFormItem label="权限字符" prop="roleKey">
                <ElInput v-model="form.roleKey" placeholder="请输入权限字符" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="24">
              <ElFormItem label="角色顺序" prop="roleSort">
                <ElInputNumber v-model="form.roleSort" :min="0" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="24">
              <ElFormItem label="角色状态" prop="status">
                <ElRadioGroup v-model="form.status">
                  <ElRadio
                    :value="dic.value"
                    v-for="dic in dict.sys_normal_disable"
                    :key="dic.value"
                    >{{ dic.label }}</ElRadio
                  >
                </ElRadioGroup>
              </ElFormItem>
            </ElCol>
            <ElCol :span="24">
              <ElFormItem label="菜单权限">
                <ElCheckbox
                  label="展开/折叠"
                  v-model="menuExpand"
                  @change="handleCheckedTreeExpand(Boolean($event), 'menu')"
                />
                <ElCheckbox
                  label="全选/全不选"
                  v-model="menuNodeAll"
                  @change="handleCheckedTreeNodeAll(Boolean($event), 'menu')"
                />
                <ElCheckbox
                  label="父子联动"
                  v-model="form.menuCheckStrictly"
                  @change="handleCheckedTreeConnect(Boolean($event), 'menu')"
                />
                <ElTree
                  class="tree-border"
                  :data="menuOptions"
                  show-checkbox
                  ref="menuTreeRef"
                  node-key="id"
                  :check-strictly="!form.menuCheckStrictly"
                  empty-text="加载中，请稍候"
                ></ElTree>
              </ElFormItem>
            </ElCol>
            <ElCol :span="24">
              <ElFormItem label="备 注" prop="remark">
                <ElInput type="textarea" v-model="form.remark" placeholder="请输入备注" />
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

      <!-- 分配数据权限弹框 -->
      <ElDialog
        title="分配数据权限"
        v-model="modalVisible"
        width="500px"
        align-center
        :close-on-click-modal="false"
      >
        <ElForm :model="form" label-width="85px">
          <ElRow>
            <ElCol :span="24">
              <ElFormItem label="角色名称" prop="roleName">
                <ElInput v-model="form.roleName" disabled placeholder="请输入角色名称" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="24">
              <ElFormItem label="权限字符" prop="roleKey">
                <ElInput v-model="form.roleKey" disabled placeholder="请输入权限字符" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="24">
              <ElFormItem label="权限范围" prop="dataScope">
                <ElSelect v-model="form.dataScope" placeholder="请选择权限范围">
                  <ElOption
                    v-for="data in dataScopeOptions"
                    :key="data.value"
                    :value="data.value"
                    :label="data.label"
                  />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="24" v-show="form.dataScope === '2'">
              <ElFormItem label="菜单权限">
                <ElCheckbox
                  label="展开/折叠"
                  v-model="deptExpand"
                  @change="handleCheckedTreeExpand(Boolean($event), 'dept')"
                />
                <ElCheckbox
                  label="全选/全不选"
                  v-model="deptNodeAll"
                  @change="handleCheckedTreeNodeAll(Boolean($event), 'dept')"
                />
                <ElCheckbox
                  label="父子联动"
                  v-model="form.deptCheckStrictly"
                  @change="handleCheckedTreeConnect(Boolean($event), 'dept')"
                />
                <ElTree
                  class="tree-border"
                  :data="deptOptions"
                  show-checkbox
                  ref="deptTreeRef"
                  node-key="id"
                  :check-strictly="!form.deptCheckStrictly"
                  empty-text="加载中，请稍候"
                ></ElTree>
              </ElFormItem>
            </ElCol>
          </ElRow>
        </ElForm>

        <template #footer>
          <span class="dialog-footer">
            <ElButton @click="modalVisible = false">取 消</ElButton>
            <ElButton type="primary" @click="submitDataScopeForm()">确 定</ElButton>
          </span>
        </template>
      </ElDialog>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/composables/useTable'
  import { Role, RoleService } from '@/api/system/role'
  import { MenuService } from '@/api/system/menu'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
  import { downloadFile } from '@/utils/http'
  import type { FormInstance, FormRules, TreeData, TreeInstance } from 'element-plus'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { ElButton } from 'element-plus'
  import { useAuth } from '@/composables/useAuth'
  import { Option, SearchFormItem } from '@/types'
  import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import useDict from '@/composables/useDict'

  defineOptions({ name: 'Roles' })

  const { hasAuth } = useAuth()
  // 接口
  const {
    listRole,
    changeRoleStatus,
    delRole,
    addRole,
    updateRole,
    getRole,
    deptTreeSelect,
    dataScope
  } = RoleService
  const { roleMenuTreeselect, treeSelect } = MenuService
  // 字典
  const { dict } = useDict(['sys_normal_disable'])

  const menuTreeRef = ref<TreeInstance>()
  const deptTreeRef = ref<TreeInstance>()

  // 定义表单搜索初始值
  const initialSearchState = {
    roleName: undefined,
    roleKey: undefined,
    status: undefined,
    daterange: []
  }
  // 表单配置项
  const formItems: SearchFormItem[] = [
    {
      label: '角色名称',
      prop: 'roleName',
      type: 'input',
      config: {
        clearable: true
      }
    },
    {
      label: '权限字符',
      prop: 'roleKey',
      type: 'input',
      config: {
        clearable: true
      }
    },
    {
      label: '状态',
      prop: 'status',
      type: 'select',
      config: {
        clearable: true
      },
      // options: [
      //   { label: '启用', value: '0' },
      //   { label: '停用', value: '1' }
      // ]
      options: dict.sys_normal_disable
    },
    {
      prop: 'daterange',
      label: '日期范围',
      type: 'daterange',
      config: {
        type: 'daterange',
        startPlaceholder: '开始时间',
        endPlaceholder: '结束时间'
      }
    }
  ]

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
  } = useTable<Role>({
    // 核心配置
    core: {
      apiFn: listRole,
      apiParams: {
        pageNum: 1,
        pageSize: 10,
        ...initialSearchState
      },
      columnsFactory: () => [
        { type: 'selection' }, // 勾选列
        { label: '角色编号', prop: 'roleId' },
        { label: '角色名称', prop: 'roleName' },
        { label: '权限字符', prop: 'roleKey' },
        { label: '显示顺序', prop: 'roleSort' },
        {
          prop: 'status',
          label: '状态',
          useSlot: true
        },
        {
          prop: 'createTime',
          label: '创建日期',
          sortable: true
        },
        {
          prop: 'operation',
          label: '操作',
          width: 180,
          align: 'center',
          fixed: 'right', // 固定列
          formatter: (row) =>
            h('div', { style: 'display: flex; align-items: center;justify-content: center;' }, [
              hasAuth('system:role:edit') &&
                !row.admin &&
                h(ArtButtonTable, {
                  type: 'edit',
                  onClick: () => showDialog('edit', row)
                }),
              hasAuth('system:role:remove') &&
                !row.admin &&
                h(ArtButtonTable, {
                  type: 'delete',
                  onClick: () => deleteRole(row)
                }),
              !row.admin &&
                h(ArtButtonMore, {
                  list: [
                    { key: 'DataScope', label: '数据权限', auth: 'system:role:edit' },
                    { key: 'AutoUser', label: '分配用户', auth: 'system:role:edit' }
                  ],
                  onClick: (item: ButtonMoreItem) => handleMore(item, row)
                })
            ])
        }
      ]
    }
  })

  // 选中行
  const selectedRows = ref<Role[]>([])
  const ids = ref<number[]>([])
  const single = ref<boolean>(true)
  const multiple = ref<boolean>(true)

  /**
   * 处理表格行选择变化
   * @param selection 行数据
   */
  const handleSelectionChange = (selection: Role[]): void => {
    selectedRows.value = selection
    ids.value = selection.map((item) => item.roleId)
    single.value = selection.length !== 1
    multiple.value = !selection.length
  }

  /**
   * 处理状态变更
   * @param row 行数据
   */
  const handleChangeStatus = (row: Role) => {
    if (!row.roleId) return
    const text = row.status === '0' ? '启用' : '停用'
    ElMessageBox.confirm('确认要' + text + '"' + row.roleName + '"角色吗？', { type: 'warning' })
      .then(function () {
        return changeRoleStatus(row.roleId, row.status)
      })
      .then(() => {
        ElMessage.success(text + '成功')
      })
      .catch(function () {
        row.status = row.status === '0' ? '1' : '0'
      })
  }

  // 是否显示弹出层（数据权限）
  const menuExpand = ref(true)
  const menuNodeAll = ref(false)
  const deptExpand = ref(true)
  const deptNodeAll = ref(false)
  const menuOptions = ref<TreeData>([])
  const deptOptions = ref<TreeData>([])
  const dataScopeOptions: Option[] = [
    {
      value: '1',
      label: '全部数据权限'
    },
    {
      value: '2',
      label: '自定数据权限'
    },
    {
      value: '3',
      label: '本部门数据权限'
    },
    {
      value: '4',
      label: '本部门及以下数据权限'
    },
    {
      value: '5',
      label: '仅本人数据权限'
    }
  ]

  const dialogVisible = ref(false)
  const modalVisible = ref(false)

  const form = reactive<Partial<Role>>({})
  const rules = reactive<FormRules>({
    roleName: [
      { required: true, message: '请输入角色名称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    roleKey: [{ required: true, message: '请输入权限字符', trigger: 'blur' }]
  })
  const isEdit = ref(false)
  const formRef = ref<FormInstance>()

  // 树权限（展开/折叠）
  const handleCheckedTreeExpand = (value: boolean, type: string) => {
    if (type === 'menu') {
      if (menuOptions.value?.length) {
        menuOptions.value.forEach((item) => {
          if (menuTreeRef.value?.store.nodesMap[item.id]) {
            menuTreeRef.value.store.nodesMap[item.id].expanded = value
          }
        })
      }
    } else if (type == 'dept') {
      if (deptOptions.value?.length) {
        deptOptions.value.forEach((item) => {
          if (deptTreeRef.value?.store.nodesMap[item.id]) {
            deptTreeRef.value.store.nodesMap[item.id].expanded = value
          }
        })
      }
    }
  }
  // 树权限（全选/全不选）
  const handleCheckedTreeNodeAll = (value: boolean, type: string) => {
    if (type === 'menu') {
      const nodes = value ? (menuOptions.value ?? []) : []
      menuTreeRef.value?.setCheckedNodes(nodes as any[])
    } else if (type === 'dept') {
      const nodes = value ? (deptOptions.value ?? []) : []
      deptTreeRef.value?.setCheckedNodes(nodes as any[])
    }
  }
  // 树权限（父子联动）
  const handleCheckedTreeConnect = (value: boolean, type: string) => {
    if (type === 'menu') {
      form.menuCheckStrictly = value ? true : false
    } else if (type === 'dept') {
      form.deptCheckStrictly = value ? true : false
    }
  }

  /**
   * 显示新增/编辑角色弹框
   * @param type 弹框类型 add/edit
   * @param row Role
   */
  const showDialog = async (type: string = 'add', row?: Role) => {
    try {
      dialogVisible.value = true
      isEdit.value = type === 'edit'
      resetForm() // 重置表单
      if (isEdit.value && row?.roleId) {
        const { data } = await getRole(row.roleId)
        Object.assign(form, data)
        const { menus, checkedKeys } = await roleMenuTreeselect(row.roleId)
        menuOptions.value = menus
        nextTick(() => {
          menuTreeRef.value?.setCheckedKeys(checkedKeys)
          handleCheckedTreeExpand(true, 'menu')
        })
      } else {
        await getTreeData('menu')
        nextTick(() => {
          menuTreeRef.value?.setCheckedKeys([])
          handleCheckedTreeExpand(true, 'menu')
        })
      }
    } catch (err) {
      console.error('showDialog 出错:', err)
    }
  }

  // 提交表单
  const submitForm = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (valid) {
        try {
          form.menuIds = getMenuAllCheckedKeys()
          if (isEdit.value) {
            await updateRole(form)
          } else {
            await addRole(form)
          }
          ElMessage.success(`${isEdit.value ? '编辑' : '新增'}成功`)
          dialogVisible.value = false
          searchData()
        } catch {
          // ElMessage.error(`${isEdit.value ? '编辑' : '新增'}失败`)
        }
      }
    })
  }

  /**
   * 显示数据权限分配弹框
   * @param row Role
   */
  const showModel = async (row: Role) => {
    modalVisible.value = true
    resetForm() // 重置表单
    try {
      const { data } = await getRole(row.roleId)
      Object.assign(form, data)
      const { depts, checkedKeys } = await deptTreeSelect(row.roleId)
      deptOptions.value = depts
      nextTick(() => {
        deptTreeRef.value?.setCheckedKeys(checkedKeys ?? [])
        handleCheckedTreeExpand(true, 'dept')
      })
    } catch {
      //
    }
  }

  // 提交表单
  const submitDataScopeForm = async () => {
    try {
      form.deptIds = getDeptAllCheckedKeys()
      await dataScope(form)
      ElMessage.success(`操作成功`)
      modalVisible.value = false
      searchData()
    } catch {
      // ElMessage.error(`${isEdit.value ? '编辑' : '新增'}失败`)
    }
  }

  // 所有菜单节点数据
  const getMenuAllCheckedKeys = (): number[] => {
    // 目前被选中的菜单节点
    let checkedKeys = menuTreeRef.value?.getCheckedKeys() ?? []
    // 半选中的菜单节点
    let halfCheckedKeys = menuTreeRef.value?.getHalfCheckedKeys() ?? []
    checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys)
    return checkedKeys.map((i) => Number(i))
  }
  // 所有部门节点数据
  const getDeptAllCheckedKeys = (): number[] => {
    // 目前被选中的部门节点
    let checkedKeys = deptTreeRef.value?.getCheckedKeys() ?? []
    // 半选中的部门节点
    let halfCheckedKeys = deptTreeRef.value?.getHalfCheckedKeys() ?? []
    checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys)
    return checkedKeys.map((i) => Number(i))
  }

  // 重置角色表单
  const resetForm = () => {
    formRef.value?.resetFields()
    menuExpand.value = true
    menuNodeAll.value = false
    menuExpand.value = true
    menuNodeAll.value = false
    Object.assign(form, {
      roleId: undefined,
      roleName: undefined,
      roleKey: undefined,
      roleSort: 0,
      status: '0',
      dataScope: '1',
      menuIds: [],
      deptIds: [],
      menuCheckStrictly: true,
      deptCheckStrictly: true,
      remark: undefined
    })
  }

  /**
   * 删除角色
   * @param row 行数据
   */
  const deleteRole = async (row?: Role | null) => {
    const roleIds: string | number = row?.roleId || ids.value.toString()
    try {
      await ElMessageBox.confirm(`确定要注销所选角色吗？`, '注销角色', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      })
      await delRole(roleIds)
      ElMessage.success('注销成功')
      searchData()
    } catch {
      // console.error(error)
    }
  }

  /**
   * 操作更多
   * @param item 所选按钮
   * @param row 行数据
   */
  const handleMore = (item: ButtonMoreItem, row: Role) => {
    switch (item.key) {
      case 'DataScope':
        showModel(row)
        break
      case 'AuthUser':
        // handleAuthRole(row)
        break
      default:
        break
    }
  }

  /**
   * 查询菜单/部门树形
   */
  const getTreeData = async (type: 'menu' | 'dept' = 'menu') => {
    try {
      const { data } = await treeSelect()
      const map: Record<typeof type, typeof menuOptions | typeof deptOptions> = {
        menu: menuOptions,
        dept: deptOptions
      }
      map[type].value = data
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * 导出列表excel
   */
  const handleExport = () => {
    downloadFile('system/role/export', { ...searchState }, `角色列表_${new Date().getTime()}.xlsx`)
  }
</script>

<style lang="scss" scoped>
  .role-page {
    .svg-icon {
      width: 1.8em;
      height: 1.8em;
      overflow: hidden;
      vertical-align: -8px;
      fill: currentcolor;
    }

    :deep(.small-btn) {
      height: 30px !important;
      padding: 0 10px !important;
      font-size: 12px !important;
    }
  }
</style>
