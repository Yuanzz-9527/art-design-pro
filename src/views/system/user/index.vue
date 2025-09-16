<!-- 用户管理 -->
<!-- art-full-height 自动计算出页面剩余高度 -->
<!-- art-table-card 一个符合系统样式的 class，同时自动撑满剩余高度 -->
<!-- 如果你想使用 template 语法，请移步功能示例下面的高级表格示例 -->
<template>
  <div class="art-full-height">
    <div class="tree-container">
      <div class="left-sidebar">
        <ElCard class="art-table-card" shadow="never" style="margin-top: 0">
          <ElInput v-model="filterText" style="margin-bottom: 10px" placeholder="请输入部门名称" />
          <ElTree
            ref="treeRef"
            class="filter-tree"
            :data="deptTree"
            node-key="id"
            :props="defaultProps"
            default-expand-all
            highlight-current
            :expand-on-click-node="false"
            :filter-node-method="filterNode"
            @node-click="handleNodeClick"
          />
        </ElCard>
      </div>

      <div class="right-content art-full-height">
        <!-- 搜索栏 -->
        <UserSearch
          v-model:filter="defaultFilter"
          @reset="handleResetSearch"
          @search="handleSearch"
        />

        <ElCard class="art-table-card" shadow="never">
          <!-- 表格头部 -->
          <ArtTableHeader v-model:columns="columnChecks" @refresh="refreshAll">
            <template #left>
              <ElButton
                @click="showDialog('add')"
                type="primary"
                plain
                v-ripple
                v-auth="['system:user:add']"
                >新增</ElButton
              >
              <ElButton
                @click="showDialog('edit')"
                type="success"
                plain
                :disabled="single"
                v-auth="'system:user:edit'"
                v-ripple
              >
                修改</ElButton
              >
              <ElButton
                @click="deleteUser()"
                type="danger"
                plain
                :disabled="multiple"
                v-auth="'system:user:remove'"
                v-ripple
              >
                删除</ElButton
              >
              <MdExcelImport
                :options="importConfig"
                title="Excel-导入用户"
                v-auth="'system:user:import'"
                @import-success="searchData()"
              ></MdExcelImport>
              <ElButton
                @click="handleExport()"
                type="warning"
                plain
                v-auth="'system:user:export'"
                v-ripple
                >导出</ElButton
              >
            </template>
          </ArtTableHeader>

          <!-- 表格 -->
          <ArtTable
            :loading="isLoading"
            :data="tableData"
            :columns="columns"
            :pagination="paginationState"
            @selection-change="handleSelectionChange"
            @pagination:size-change="onPageSizeChange"
            @pagination:current-change="onCurrentPageChange"
          >
            <template #sex="{ value }">
              <ArtDict :options="dict.sys_user_sex" :value="value"></ArtDict>
            </template>
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

          <!-- 用户弹窗 -->
          <UserDialog
            v-model:visible="dialogVisible"
            :type="dialogType"
            :user-data="currentUserData"
            :dept-tree="deptTreeDisabled"
            :post-list="postList"
            :role-list="roleList"
            @submit="handleDialogSubmit"
          />
        </ElCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
  import MdExcelImport from '@/components/core/forms/md-excel-import/index.vue'
  import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import { ElMessageBox, ElMessage } from 'element-plus'
  import { useTable } from '@/composables/useTable'
  import useDict from '@/composables/useDict'
  import { UserService, type User } from '@/api/system/user'
  import UserSearch from './modules/user-search.vue'
  import UserDialog from './modules/user-dialog.vue'
  import type { FilterNodeMethodFunction, TreeInstance, TreeNodeData, TreeData } from 'element-plus'
  import { downloadFile } from '@/utils/http'
  import avatar1 from '@/assets/img/avatar/avatar1.jpeg'
  import avatar2 from '@/assets/img/avatar/avatar2.jpeg'
  import { useAuth } from '@/composables/useAuth'

  defineOptions({ name: 'User' })

  const { listUser, changeUserStatus } = UserService

  const { dict } = useDict(['sys_user_sex', 'sys_normal_disable'])

  const { hasAuth } = useAuth()

  // 弹窗相关
  const dialogType = ref<Form.DialogType>('add')
  const dialogVisible = ref(false)
  const currentUserData = ref<Partial<User>>({})
  const postList = ref<Record<string, any>[]>([])
  const roleList = ref<Record<string, any>[]>([])

  // 选中行
  const selectedRows = ref<User[]>([])
  const ids = ref<number[]>([])
  const single = ref<boolean>(true)
  const multiple = ref<boolean>(true)

  // 表单搜索初始值
  const defaultFilter = ref({
    userName: undefined,
    phonenumber: undefined,
    status: undefined,
    deptId: undefined
  })

  const deptTree = ref<TreeData>([])
  const deptTreeDisabled = ref<TreeData>([])
  const filterText = ref('')
  const treeRef = ref<TreeInstance>()

  const defaultProps = {
    children: 'children',
    label: 'label'
  }

  /**
   * 获取部门树形数据
   */
  const getDeptTreeData = async () => {
    try {
      const { data } = await UserService.deptTreeSelect()
      deptTree.value = data
      deptTreeDisabled.value = filterDisabledDept(JSON.parse(JSON.stringify(data)))
    } catch (error) {
      console.log(error)
    }
  }

  getDeptTreeData()

  // 过滤禁用的部门
  const filterDisabledDept = (deptList: TreeData): TreeData => {
    return deptList.filter((dept) => {
      if (dept.disabled) {
        return false
      }
      if (dept.children && dept.children.length) {
        dept.children = filterDisabledDept(dept.children)
      }
      return true
    })
  }

  // 树形数据前端过滤
  watch(filterText, (val) => {
    treeRef.value!.filter(val)
  })
  const filterNode: FilterNodeMethodFunction = (value: string, data: TreeNodeData) => {
    if (!value) return true
    return data.label.includes(value)
  }

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
  } = useTable<User>({
    // 核心配置
    core: {
      apiFn: listUser,
      apiParams: {
        pageNum: 1,
        pageSize: 10,
        ...defaultFilter.value
      },
      // 自定义分页字段映射，同时需要在 apiParams 中配置字段名
      // paginationKey: {
      //   current: 'pageNum',
      //   size: 'pageSize'
      // },
      columnsFactory: () => [
        { type: 'selection' }, // 勾选列
        { type: 'index', width: 60, label: '序号' }, // 序号
        { label: '账 号', prop: 'userName' },
        {
          prop: 'avatar',
          label: '用户名',
          minWidth: 160,
          formatter: (row) => {
            return h('div', { class: 'user', style: 'display: flex; align-items: center' }, [
              h('img', { class: 'avatar', src: row.avatar }),
              h('div', {}, [
                h('p', { class: 'user-name' }, row.nickName),
                h('p', { class: 'email' }, row.email)
              ])
            ])
          }
        },
        {
          prop: 'sex',
          label: '性别',
          align: 'center',
          sortable: true,
          useSlot: true
          // checked: false, // 隐藏列
        },
        {
          prop: 'dept',
          label: '部 门',
          formatter: (row) => {
            return (row.dept as any)?.deptName || '--'
          }
        },
        { prop: 'phonenumber', label: '手机号' },
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
              hasAuth('system:user:edit') &&
                h(ArtButtonTable, {
                  type: 'edit',
                  onClick: () => showDialog('edit', row)
                }),
              hasAuth('system:user:remove') &&
                h(ArtButtonTable, {
                  type: 'delete',
                  onClick: () => deleteUser(row)
                }),
              h(ArtButtonMore, {
                list: [
                  { key: 'ResetPwd', label: '重置密码', auth: 'system:user:resetPwd' },
                  { key: 'AutoRole', label: '分配角色', auth: 'system:user:edit' }
                ],
                onClick: (item: ButtonMoreItem) => handleMore(item, row)
              })
            ])
        }
      ]
    },
    // 数据处理
    transform: {
      // 数据转换器 - 替换头像
      dataTransformer: (records: any) => {
        // 类型守卫检查
        if (!Array.isArray(records)) {
          console.warn('数据转换器: 期望数组类型，实际收到:', typeof records)
          return []
        }

        // 使用本地头像替换接口返回的头像
        return records.map((item: any) => {
          return {
            ...item,
            avatar: item.avatar
              ? import.meta.env.BASE_URL + item.avatar
              : item.sex === '0'
                ? avatar1
                : avatar2
          }
        })
      }
    }
  })

  /**
   * 搜索处理
   * @param params 参数
   */
  const handleSearch = (params: Record<string, any>) => {
    // 处理日期区间参数，把 daterange 转换为 startTime 和 endTime
    const { daterange, ...searchParams } = params
    if (Array.isArray(daterange) && daterange[0] && daterange[1]) {
      const [beginTime, endTime] = daterange
      // 搜索参数赋值
      Object.assign(searchState, { ...searchParams, params: { beginTime, endTime } })
    } else {
      Object.assign(searchState, { ...searchParams })
    }
    searchData()
  }

  /**
   * 重置搜索条件
   */
  const handleResetSearch = (): void => {
    treeRef.value?.setCurrentKey()
    resetSearch()
  }

  /**
   * 部门树形节点点击事件
   * @param data tree节点数据
   */
  const handleNodeClick = (data: TreeNodeData) => {
    searchState.deptId = data.id
    searchData()
  }

  /**
   * 显示用户弹窗
   * @param type 弹框（操作）类型
   * @param row 行数据
   */
  const showDialog = async (type: Form.DialogType, row?: User): Promise<void> => {
    dialogType.value = type
    const userIds: number[] | number = row?.userId || ids.value
    try {
      const { data, posts, roles, postIds, roleIds } = await UserService.getUser(userIds)
      currentUserData.value = data || {}
      postList.value = posts
      roleList.value = roles
      if (type === 'edit') {
        currentUserData.value.postIds = postIds
        currentUserData.value.roleIds = roleIds
      } else {
        currentUserData.value = {}
      }
    } catch (error) {
      console.log(error)
    }
    nextTick(() => {
      dialogVisible.value = true
    })
  }

  /**
   * 删除用户
   * @param row 行数据
   */
  const deleteUser = (row?: User | null): void => {
    const userIds: number[] | number = row?.userId || ids.value

    ElMessageBox.confirm(`确定要注销所选用户吗？`, '注销用户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    })
      .then(() => {
        return UserService.delUser(userIds)
      })
      .then(() => {
        ElMessage.success('注销成功')
        searchData()
      })
  }

  /**
   * 处理弹窗提交事件
   */
  const handleDialogSubmit = async () => {
    try {
      searchData()
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  /**
   * 处理表格行选择变化
   * @param selection 行数据
   */
  const handleSelectionChange = (selection: User[]): void => {
    selectedRows.value = selection
    ids.value = selection.map((item) => item.userId)
    single.value = selection.length !== 1
    multiple.value = !selection.length
  }

  /**
   * 处理状态变更
   * @param row 行数据
   */
  const handleChangeStatus = (row: User) => {
    if (!row.userId) return
    const text = row.status === '0' ? '启用' : '停用'
    ElMessageBox.confirm('确认要' + text + '"' + row.userName + '"用户吗？', { type: 'warning' })
      .then(function () {
        return changeUserStatus(row.userId, row.status)
      })
      .then(() => {
        ElMessage.success(text + '成功')
      })
      .catch(function () {
        row.status = row.status === '0' ? '1' : '0'
      })
  }

  /**
   * 操作更多
   * @param item 所选按钮
   * @param row 行数据
   */
  const handleMore = (item: ButtonMoreItem, row: User) => {
    switch (item.key) {
      case 'ResetPwd':
        handleResetPwd(row)
        break
      case 'AuthRole':
        // handleAuthRole(row)
        break
      default:
        break
    }
  }

  /**
   * 重置密码
   * @param row 行数据
   */
  const handleResetPwd = (row: User) => {
    ElMessageBox.prompt('请输入"' + row.userName + '"的新密码', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      closeOnClickModal: false,
      inputType: 'text', // password不会有显隐小眼睛
      inputPattern: /^.{8,20}$/,
      inputErrorMessage: '用户密码长度必须介于 8 和 20 之间',
      inputValidator: (value: string): string | boolean => {
        if (value.length < 8 || value.length > 20) {
          return '密码长度需在 8–20 位之间'
        }

        if (!/[a-z]/.test(value)) {
          return '密码需包含至少一个小写字母'
        }

        if (!/[A-Z]/.test(value)) {
          return '密码需包含至少一个大写字母'
        }

        if (!/\d/.test(value)) {
          return '密码需包含至少一个数字'
        }

        if (!/[._~!@#$^&*]/.test(value)) {
          return '密码需包含至少一个特殊符号（._~!@#$^&*）'
        }

        if (!/^[A-Za-z\d._~!@#$^&*]+$/.test(value)) {
          return '密码仅能包含字母、数字和指定的特殊符号（._~!@#$^&*）'
        }

        return true
      }
    }).then(async ({ value }) => {
      try {
        await UserService.resetUserPwd(row.userId, value)
        ElMessage.success('重置成功')
      } catch (error) {
        console.log(error)
      }
    })
  }

  // 导入配置
  const importConfig = {
    importUrl: `${import.meta.env.VITE_API_URL}/system/user/importData`,
    templateUrl: 'system/user/importTemplate',
    templateName: `用户列表_模板_${new Date().getTime()}.xlsx`
  }

  /**
   * 导出列表excel
   */
  const handleExport = () => {
    downloadFile('system/user/export', { ...searchState }, `用户列表_${new Date().getTime()}.xlsx`)
  }
</script>

<style lang="scss" scoped>
  .tree-container {
    box-sizing: border-box;
    display: flex;
    gap: 16px;
    height: 100%;

    .left-sidebar {
      flex-shrink: 0;
      width: 230px;
      height: 100%;
    }

    .right-content {
      flex-grow: 1;
      min-width: 0;
      height: 100%;
    }

    .art-table-card {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    :deep(.user) {
      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 6px;
      }

      > div {
        margin-left: 10px;

        .user-name {
          font-weight: 500;
          color: var(--art-text-gray-800);
        }
      }
    }
  }

  @media screen and (max-width: $device-ipad) {
    .tree-container {
      display: block;
      gap: 0;
      height: auto;

      .left-sidebar {
        width: 100%;
        height: auto;
        margin-bottom: 20px;
      }
    }
  }
</style>
