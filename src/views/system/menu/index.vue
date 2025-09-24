<template>
  <div class="menu-page art-full-height">
    <!-- 搜索栏 -->
    <ArtSearchBar
      v-model:filter="formFilters"
      :items="formItems"
      :showExpand="false"
      @reset="handleReset"
      @search="handleSearch"
    ></ArtSearchBar>

    <ElCard class="art-table-card" shadow="never">
      <!-- 表格头部 -->
      <ArtTableHeader :showZebra="false" v-model:columns="columnChecks" @refresh="handleRefresh">
        <template #left>
          <!-- 按钮权限：后端控制模式，使用自定义指令 -->
          <ElButton v-auth="'system:menu:add'" plain type="primary" @click="handleAdd()" v-ripple>
            添加菜单
          </ElButton>
          <ElButton @click="toggleExpand" plain type="info" v-ripple>
            {{ isExpanded ? '收起' : '展开' }}
          </ElButton>
        </template>
      </ArtTableHeader>

      <ArtTable
        ref="tableRef"
        rowKey="menuId"
        :loading="loading"
        :columns="columns"
        :data="tableData"
        :stripe="false"
      />

      <ElDialog
        :title="dialogTitle"
        v-model="dialogVisible"
        width="700px"
        align-center
        :close-on-click-modal="false"
      >
        <ElForm ref="formRef" :model="form" :rules="rules" label-width="85px">
          <ElFormItem label="上级菜单" prop="parentId">
            <ElTreeSelect
              v-model="form.parentId"
              :data="menuOptions"
              check-strictly
              node-key="menuId"
              :props="{ label: 'menuName' }"
              placeholder="请选择上级菜单"
              :render-after-expand="false"
            />
          </ElFormItem>
          <ElFormItem label="菜单类型">
            <ElRadioGroup v-model="form.menuType">
              <ElRadioButton value="M" label="M">目录</ElRadioButton>
              <ElRadioButton value="C" label="C">菜单</ElRadioButton>
              <ElRadioButton value="F" label="F">按钮</ElRadioButton>
            </ElRadioGroup>
          </ElFormItem>
          <ElRow :gutter="20">
            <ElCol :span="12" v-if="form.menuType !== 'F'">
              <ElFormItem label="菜单图标" prop="icon">
                <ArtIconSelector v-model="form.icon" :iconType="iconType" width="100%" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="显示排序" prop="orderNum" style="width: 100%">
                <ElInputNumber
                  v-model="form.orderNum"
                  style="width: 100%"
                  :min="1"
                  controls-position="right"
                />
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="20">
            <ElCol :span="12">
              <ElFormItem label="菜单名称" prop="menuName">
                <ElInput v-model="form.menuName" placeholder="菜单名称"></ElInput>
              </ElFormItem>
            </ElCol>
            <ElCol :span="12" v-if="form.menuType === 'C'">
              <ElFormItem label="路由名称" prop="routeName">
                <ElInput v-model="form.routeName" placeholder="路由名称"></ElInput>
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="20" v-if="form.menuType !== 'F'">
            <ElCol :span="12">
              <ElFormItem label="是否外链" prop="isFrame" style="width: 100%">
                <ElRadioGroup v-model="form.isFrame">
                  <ElRadio value="0" label="0">是</ElRadio>
                  <ElRadio value="1" label="1">否</ElRadio>
                </ElRadioGroup>
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="路由地址" prop="path">
                <ElInput v-model="form.path" placeholder="路由地址"></ElInput>
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="20">
            <ElCol :span="12" v-if="form.menuType === 'C'">
              <ElFormItem label="组件路径" prop="component">
                <ElInput v-model="form.component" placeholder="组件路径"></ElInput>
              </ElFormItem>
            </ElCol>
            <ElCol :span="12" v-if="form.menuType !== 'M'">
              <ElFormItem label="权限字符" prop="perms">
                <ElInput v-model="form.perms" placeholder="权限字符"></ElInput>
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="20" v-if="form.menuType === 'C'">
            <ElCol :span="12">
              <ElFormItem label="路由参数" prop="query">
                <ElInput v-model="form.query" placeholder="路由参数"></ElInput>
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="是否缓存" prop="isCache" style="width: 100%">
                <ElRadioGroup v-model="form.isCache">
                  <ElRadio value="0" label="0">缓存</ElRadio>
                  <ElRadio value="1" label="1">不缓存</ElRadio>
                </ElRadioGroup>
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="20">
            <ElCol :span="12" v-if="form.menuType !== 'F'">
              <ElFormItem label="显示状态" prop="visible">
                <ElRadioGroup v-model="form.visible">
                  <ElRadio value="0" label="0">显示</ElRadio>
                  <ElRadio value="1" label="1">隐藏</ElRadio>
                </ElRadioGroup>
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="菜单状态" prop="status" style="width: 100%">
                <ElRadioGroup v-model="form.status">
                  <ElRadio value="0" label="0">正常</ElRadio>
                  <ElRadio value="1" label="1">停用</ElRadio>
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
  import { type Menu, MenuService } from '@/api/system/menu'
  import type { FormInstance, FormRules, TreeData } from 'element-plus'
  import { ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import { IconTypeEnum } from '@/enums/appEnum'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtDict from '@/components/core/forms/art-dict/index.vue'
  import { useTableColumns } from '@/composables/useTableColumns'
  import { ElButton } from 'element-plus'
  import { useAuth } from '@/composables/useAuth'
  import { SearchFormItem } from '@/types'
  import useDict from '@/composables/useDict'
  import { handleTree } from '@/utils'

  defineOptions({ name: 'Menus' })

  const { hasAuth } = useAuth()
  // 字典
  const { dict } = useDict(['sys_normal_disable'])
  const { listMenu, addMenu, updateMenu, getMenu, delMenu } = MenuService

  const loading = ref(false)

  // 定义表单搜索初始值
  const initialSearchState = {
    menuName: undefined,
    status: undefined
  }

  // 响应式表单数据
  const formFilters = reactive({ ...initialSearchState })

  // 重置表单
  const handleReset = () => {
    Object.assign(formFilters, { ...initialSearchState })
    getTableData()
  }

  // 搜索处理
  const handleSearch = () => {
    getTableData()
  }

  // 表单配置项
  const formItems: SearchFormItem[] = [
    {
      label: '菜单名称',
      prop: 'menuName',
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
      options: dict.sys_normal_disable
    }
  ]

  // 构建菜单类型标签
  const buildMenuTypeTag = (row: Menu) => {
    if (row.isFrame === '0') return 'warning'
    switch (row.menuType) {
      case 'M':
        return 'info'
      case 'C':
        return 'success'
      case 'F':
        return 'primary'
      default:
        return 'warning'
    }
  }

  // 构建菜单类型文本
  const buildMenuTypeText = (row: Menu) => {
    if (row.isFrame === '0') return '外链'
    switch (row.menuType) {
      case 'M':
        return '目录'
      case 'C':
        return '菜单'
      case 'F':
        return '按钮'
      default:
        return '未知'
    }
  }

  // 动态列配置
  const { columnChecks, columns } = useTableColumns(() => [
    {
      prop: 'menuName',
      label: '菜单名称',
      minWidth: 120
    },
    {
      prop: 'icon',
      label: '图标',
      align: 'center',
      formatter: (row: Menu) => {
        return h(
          'i',
          {
            class: 'iconfont-sys',
            innerHTML: row.icon
          },
          row.icon
        )
      }
    },
    {
      prop: 'menuType',
      label: '菜单类型',
      align: 'center',
      formatter: (row: Menu) => {
        return h(ElTag, { type: buildMenuTypeTag(row) }, () => buildMenuTypeText(row))
      }
    },
    {
      prop: 'perms',
      label: '权限标识',
      minWidth: 120
    },
    {
      prop: 'component',
      label: '组件路径',
      minWidth: 120
    },
    {
      prop: 'path',
      label: '路由',
      formatter: (row: Menu) => {
        return row.path
      }
    },
    {
      prop: 'visible',
      label: '隐藏菜单',
      formatter: (row) => {
        return h(ElTag, { type: row.visible === '1' ? 'danger' : 'info' }, () =>
          row.visible === '1' ? '是' : '否'
        )
      }
    },
    {
      prop: 'status',
      label: '状态',
      formatter: (row: Menu) => {
        return h(ArtDict, { value: row.status, options: dict.sys_normal_disable })
      }
    },
    {
      prop: 'createTime',
      label: '创建时间',
      align: 'center',
      minWidth: 100
    },
    {
      prop: 'operation',
      label: '操作',
      width: 180,
      formatter: (row: Menu) => {
        return h('div', [
          hasAuth('add') &&
            h(ArtButtonTable, {
              type: 'add',
              onClick: () => handleAdd(row)
            }),
          hasAuth('edit') &&
            h(ArtButtonTable, {
              type: 'edit',
              onClick: () => handleUpdate(row)
            }),
          hasAuth('delete') &&
            h(ArtButtonTable, {
              type: 'delete',
              onClick: () => deleteMenu(row)
            })
        ])
      }
    }
  ])

  const handleRefresh = () => {
    getTableData()
  }

  const dialogVisible = ref(false)
  const form = reactive<Partial<Menu>>({})
  const iconType = ref(IconTypeEnum.UNICODE)

  const rules = reactive<FormRules>({
    menuName: [
      { required: true, message: '请输入菜单名称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    orderNum: [{ required: true, message: '请输入显示排序', trigger: 'blur' }],
    path: [{ required: true, message: '输入路由地址', trigger: 'blur' }],
    parentId: [{ required: true, message: '请选择上级菜单', trigger: 'blur' }]
  })

  const tableData = ref<Menu[]>([])
  const menuOptions = ref<TreeData>([])

  onMounted(() => {
    getTableData()
  })

  const getTableData = async () => {
    loading.value = true
    try {
      const { data } = await listMenu(formFilters)
      tableData.value = handleTree<Menu>(data, { id: 'menuId' })
      loading.value = false
    } catch {
      //
    }
  }

  const isEdit = ref(false)
  const formRef = ref<FormInstance>()
  const dialogTitle = computed(() => {
    return isEdit.value ? `编辑菜单` : `新建菜单`
  })

  const submitForm = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
      if (valid) {
        try {
          if (!isEdit.value) {
            await addMenu(form as Menu)
          } else {
            await updateMenu(form as Menu)
          }
          ElMessage.success(`${isEdit.value ? '编辑' : '新增'}成功`)
          getTableData()
          dialogVisible.value = false
        } catch {
          //
        }
      }
    })
  }

  /**
   * 新增菜单
   * @param row Menu
   */
  const handleAdd = async (row?: Menu) => {
    try {
      resetForm()
      await getTreeselect()
      if (row != null && row.menuId) {
        form.parentId = row.menuId
      } else {
        form.parentId = 0
      }
      dialogVisible.value = true
    } catch {
      //
    }
  }

  /**
   * 修改菜单
   * @param row Menu
   */
  const handleUpdate = async (row: Menu) => {
    try {
      resetForm()
      await getTreeselect()
      isEdit.value = true
      const { data } = await getMenu(row.menuId)
      Object.assign(form, {
        // 菜单
        menuId: data.menuId ?? '',
        parentId: data.parentId ?? 0,
        menuName: data.menuName ?? '',
        icon: data.icon ?? '',
        menuType: data.menuType ?? 'M',
        orderNum: data.orderNum ?? 0,
        isFrame: data.isFrame ?? '1',
        isCache: data.isCache ?? '0',
        visible: data.visible ?? '0',
        status: data.status ?? '0',
        path: data.path ?? '',
        query: data.query ?? '',
        component: data.component ?? '',
        perms: data.perms ?? '',
        routeName: data.routeName ?? ''
      })
      dialogVisible.value = true
    } catch {
      //
    }
  }

  /**
   * 查询菜单树形
   */
  const getTreeselect = async () => {
    try {
      menuOptions.value = []
      const { data } = await listMenu({})
      const menu: Partial<Menu> = { menuId: 0, menuName: '主类目', children: [] }
      menu.children = handleTree(data, { id: 'menuId' })
      menuOptions.value.push(menu)
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
      // 菜单
      menuId: undefined,
      parentId: 0,
      menuName: '',
      icon: '',
      menuType: 'M',
      orderNum: 0,
      isFrame: '1',
      isCache: '0',
      visible: '0',
      status: '0',
      path: '',
      query: '',
      component: '',
      perms: '',
      routeName: ''
    })
  }

  const deleteMenu = async (row: Menu) => {
    try {
      await ElMessageBox.confirm('确定要删除该菜单吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await delMenu(Number(row.menuId))
      ElMessage.success('删除成功')
      getTableData()
    } catch {
      //
    }
  }

  const isExpanded = ref(false)
  const tableRef = ref()

  const toggleExpand = () => {
    isExpanded.value = !isExpanded.value
    nextTick(() => {
      if (tableRef.value && tableData.value) {
        // 递归处理所有行的展开/收起状态
        const processRows = (rows: Menu[]) => {
          rows.forEach((row) => {
            if (row.children && row.children.length > 0) {
              tableRef.value.elTableRef.toggleRowExpansion(row, isExpanded.value)
              processRows(row.children)
            }
          })
        }
        processRows(tableData.value)
      }
    })
  }
</script>

<style lang="scss" scoped>
  .menu-page {
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
