<template>
  <ElForm ref="genInfoRef" :model="localInfo" :rules="rules" label-width="150px">
    <ElRow v-if="localInfo">
      <ElCol :span="12">
        <ElFormItem label="生成模板" prop="tplCategory">
          <ElSelect v-model="localInfo.tplCategory" @change="tplSelectChange">
            <ElOption
              v-for="item in tplCategoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></ElOption>
          </ElSelect>
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="前端类型" prop="tplWebType">
          <ElSelect v-model="localInfo.tplWebType">
            <ElOption label="Vue2 Element UI 模版" value="element-ui"></ElOption>
            <ElOption label="Vue3 Element Plus 模版" value="element-plus"></ElOption>
          </ElSelect>
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="生成包路径" prop="packageName">
          <template #label>
            <span>生成包路径</span>
            <ElTooltip content="生成在哪个java包下，例如 com.ruoyi.system" placement="top">
              <i class="iconfont-sys">&#xe6bb;</i>
            </ElTooltip>
          </template>
          <ElInput placeholder="请输入" v-model="localInfo.packageName" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="生成模块名" prop="moduleName">
          <template #label>
            <span>生成模块名</span>
            <ElTooltip content="可理解为子系统名，例如 system" placement="top">
              <i class="iconfont-sys">&#xe6bb;</i>
            </ElTooltip>
          </template>
          <ElInput placeholder="请输入" v-model="localInfo.moduleName" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="生成业务名" prop="businessName">
          <template #label>
            <span>生成业务名</span>
            <ElTooltip content="可理解为功能英文名，例如 user" placement="top">
              <i class="iconfont-sys">&#xe6bb;</i>
            </ElTooltip>
          </template>
          <ElInput placeholder="请输入" v-model="localInfo.businessName" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="生成功能名" prop="functionName">
          <template #label>
            <span>生成功能名</span>
            <ElTooltip content="用作类描述，例如 用户" placement="top">
              <i class="iconfont-sys">&#xe6bb;</i>
            </ElTooltip>
          </template>
          <ElInput placeholder="请输入" v-model="localInfo.functionName" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="生成代码方式" prop="genType">
          <template #label>
            <span>生成代码方式</span>
            <ElTooltip content="默认为zip压缩包下载，也可以自定义生成路径" placement="top">
              <i class="iconfont-sys">&#xe6bb;</i>
            </ElTooltip>
          </template>
          <el-radio-group v-model="localInfo.genType">
            <el-radio value="0">zip压缩包</el-radio>
            <el-radio value="1">自定义路径</el-radio>
          </el-radio-group>
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="上级菜单" prop="genType">
          <template #label>
            <span>上级菜单</span>
            <ElTooltip content="分配到指定菜单下，例如 系统管理" placement="top">
              <i class="iconfont-sys">&#xe6bb;</i>
            </ElTooltip>
          </template>
          <ElTreeSelect
            v-model="localInfo.parentMenuId"
            :data="menus"
            check-strictly
            node-key="menuId"
            :props="{ label: 'menuName' }"
            placeholder="请选择系统菜单"
            :render-after-expand="false"
          />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12" v-if="localInfo.genType === '1'">
        <ElFormItem label="自定义路径" prop="genPath">
          <template #label>
            <span>自定义路径</span>
            <ElTooltip content="填写磁盘绝对路径，若不填写，则生成到当前Web项目下" placement="top">
              <i class="iconfont-sys">&#xe6bb;</i>
            </ElTooltip>
          </template>
          <ElInput placeholder="请输入" v-model="localInfo.genPath">
            <template #append>
              <ElDropdown>
                <ElButton type="primary">
                  最近路径快速选择
                  <i class="el-icon-arrow-down el-icon--right"></i>
                </ElButton>
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem @click="localInfo.genPath = '/'"
                      >恢复默认的生成基础路径</ElDropdownItem
                    >
                  </ElDropdownMenu>
                </template>
              </ElDropdown>
            </template>
          </ElInput>
        </ElFormItem>
      </ElCol>
    </ElRow>
    <ElRow v-show="localInfo.tplCategory === 'tree'">
      <ElDivider>其他信息</ElDivider>
      <ElCol :span="12">
        <ElFormItem label="树编码字段" prop="treeCode">
          <template #label>
            <span>树编码字段</span>
            <ElTooltip content="树显示的编码字段名， 如：dept_id" placement="top">
              <i class="iconfont-sys">&#xe6bb;</i>
            </ElTooltip>
          </template>
          <ElSelect v-model="localInfo.treeCode">
            <ElOption
              v-for="item in localInfo.columns"
              :key="item.columnName"
              :label="item.columnName + '：' + item.columnComment"
              :value="item.columnName"
            ></ElOption>
          </ElSelect>
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="树父编码字段" prop="treeParentCode">
          <template #label>
            <span>树父编码字段</span>
            <ElTooltip content="树显示的父编码字段名， 如：parent_Id" placement="top">
              <i class="iconfont-sys">&#xe6bb;</i>
            </ElTooltip>
          </template>
          <ElSelect v-model="localInfo.treeParentCode">
            <ElOption
              v-for="item in localInfo.columns"
              :key="item.columnName"
              :label="item.columnName + '：' + item.columnComment"
              :value="item.columnName"
            ></ElOption>
          </ElSelect>
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="树名称字段" prop="treeName">
          <template #label>
            <span>树名称字段</span>
            <ElTooltip content="树节点的显示名称字段名， 如：dept_name" placement="top">
              <i class="iconfont-sys">&#xe6bb;</i>
            </ElTooltip>
          </template>
          <ElSelect v-model="localInfo.treeName">
            <ElOption
              v-for="item in localInfo.columns"
              :key="item.columnName"
              :label="item.columnName + '：' + item.columnComment"
              :value="item.columnName"
            ></ElOption>
          </ElSelect>
        </ElFormItem>
      </ElCol>
    </ElRow>
    <ElRow v-show="localInfo.tplCategory === 'sub'">
      <ElDivider>关联信息</ElDivider>
      <ElCol :span="12">
        <ElFormItem label="关联子表的表名" prop="subTableName">
          <template #label>
            <span>关联子表的表名</span>
            <ElTooltip content="关联子表的表名， 如：sys_user" placement="top">
              <i class="iconfont-sys">&#xe6bb;</i>
            </ElTooltip>
          </template>
          <ElSelect v-model="localInfo.subTableName" @change="subSelectChange">
            <ElOption
              v-for="item in tables"
              :key="item.tableName"
              :label="item.tableName + '：' + item.tableComment"
              :value="item.tableName"
            ></ElOption>
          </ElSelect>
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="子表关联的外键名" prop="subTableFkName">
          <template #label>
            <span>子表关联的外键名</span>
            <ElTooltip content="子表关联的外键名， 如：user_id" placement="top">
              <i class="iconfont-sys">&#xe6bb;</i>
            </ElTooltip>
          </template>
          <ElSelect v-model="localInfo.subTableFkName">
            <ElOption
              v-for="item in localInfo.columns"
              :key="item.columnName"
              :label="item.columnName + '：' + item.columnComment"
              :value="item.columnName"
            ></ElOption>
          </ElSelect>
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="树名称字段" prop="treeName">
          <template #label>
            <span>树名称字段</span>
            <ElTooltip content="树节点的显示名称字段名， 如：dept_name" placement="top">
              <i class="iconfont-sys">&#xe6bb;</i>
            </ElTooltip>
          </template>
          <ElSelect v-model="localInfo.treeName">
            <ElOption
              v-for="item in localInfo.columns"
              :key="item.columnName"
              :label="item.columnName + '：' + item.columnComment"
              :value="item.columnName"
            ></ElOption>
          </ElSelect>
        </ElFormItem>
      </ElCol>
    </ElRow>
  </ElForm>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules, TreeData } from 'element-plus'
  import type { GenItem, GenTableColumn } from '@/api/tool/gen'
  import { type Menu, MenuService } from '@/api/system/menu'
  import { handleTree } from '@/utils'

  defineOptions({ name: 'GenInfo' })

  const props = withDefaults(
    defineProps<{
      info: GenItem
      tables: GenItem[]
    }>(),
    {}
  )

  const genInfoRef = ref<FormInstance>()
  const rules = computed<FormRules>(() => ({
    tplCategory: [{ required: true, message: '请选择生成模板', trigger: 'change' }],
    packageName: [{ required: true, message: '请输入生成包路径', trigger: 'blur' }],
    moduleName: [{ required: true, message: '请输入生成模块名', trigger: 'blur' }],
    businessName: [{ required: true, message: '请输入生成业务名', trigger: 'blur' }],
    functionName: [{ required: true, message: '请输入生成功能名', trigger: 'blur' }]
  }))

  const tplCategoryOptions = [
    { label: '单表（增删改查）', value: 'crud' },
    { label: '树表（增删改查）', value: 'tree' },
    { label: '主子表（增删改查）', value: 'sub' }
  ]

  const menus = ref<TreeData>([])
  // 获取菜单
  const getMenus = async () => {
    const { data } = await MenuService.listMenu()
    const menu: Partial<Menu> = { menuId: 0, menuName: '主类目', children: [] }
    menu.children = handleTree(data, { id: 'menuId' })
    menus.value.push(menu)
  }
  getMenus()

  /** 选择生成模板触发 */
  const tplSelectChange = (value: string) => {
    if (value !== 'sub') {
      localInfo.value.subTableName = ''
      localInfo.value.subTableFkName = ''
    }
  }
  /** 选择子表名触发 */
  const subSelectChange = (value: string) => {
    localInfo.value.subTableFkName = ''
    setSubTableColumns(value)
  }
  const subColumns = ref<GenTableColumn[]>([])
  /** 设置关联外键 */
  const setSubTableColumns = (value: string) => {
    for (let item in props.tables) {
      const name = props.tables[item].tableName
      if (value === name) {
        subColumns.value = props.tables[item].columns
        break
      }
    }
  }

  const emit = defineEmits<{
    (e: 'update:info', value: GenItem): void
  }>()

  const localInfo = computed({
    get: () => props.info,
    set: (value) => emit('update:info', value)
  })

  defineExpose({
    genInfoRef
  })
</script>
