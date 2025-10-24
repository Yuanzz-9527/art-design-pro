<template>
  <div class="gen-edit-page art-full-height">
    <!-- 编辑表 -->
    <ElCard class="art-table-card" shadow="never" v-loading="loading">
      <ElTabs v-model="activeName" v-if="tableInfo">
        <ElTabPane label="基本信息" name="basic">
          <BasicInfo ref="BasicInfoRef" :info="tableInfo.info"></BasicInfo>
        </ElTabPane>
        <ElTabPane label="字段信息" name="column">
          <div class="table-con" ref="boxRef">
            <VueDraggable target="tbody" handle=".handle" v-model="tableInfo.rows" :animation="150">
              <ElTable :data="tableInfo.rows" :height="height">
                <ElTableColumn label="" width="30">
                  <ElButton link type="info" size="default" class="handle"
                    ><i class="iconfont-sys">&#xe6b1;</i></ElButton
                  >
                </ElTableColumn>
                <ElTableColumn label="字段列名" prop="columnName" align="left" />
                <ElTableColumn label="字段描述" prop="columnComment">
                  <template #default="{ row }">
                    <ElInput v-model="row.columnComment"></ElInput>
                  </template>
                </ElTableColumn>
                <ElTableColumn label="物理类型" prop="columnType" />
                <ElTableColumn label="Java类型" prop="javaType">
                  <template #default="{ row }">
                    <ElSelect v-model="row.javaType">
                      <ElOption
                        :label="item.label"
                        :value="item.value"
                        :key="item.value"
                        v-for="item in javaTypeOptions"
                      ></ElOption>
                    </ElSelect>
                  </template>
                </ElTableColumn>
                <ElTableColumn label="Java属性" prop="javaField">
                  <template #default="{ row }">
                    <ElInput v-model="row.javaField"></ElInput>
                  </template>
                </ElTableColumn>
                <ElTableColumn label="插入" prop="isInsert" width="80" align="center">
                  <template #default="{ row }">
                    <ElCheckbox
                      v-model="row.isInsert"
                      size="large"
                      true-value="1"
                      false-value="0"
                    />
                  </template>
                </ElTableColumn>
                <ElTableColumn label="编辑" prop="isEdit" width="80" align="center">
                  <template #default="{ row }">
                    <ElCheckbox
                      v-model="row.isInsert"
                      size="large"
                      true-value="1"
                      false-value="0"
                    />
                  </template>
                </ElTableColumn>
                <ElTableColumn label="列表" prop="isList" width="80" align="center">
                  <template #default="{ row }">
                    <ElCheckbox v-model="row.isList" size="large" true-value="1" false-value="0" />
                  </template>
                </ElTableColumn>
                <ElTableColumn label="查询" prop="isQuery" width="80" align="center">
                  <template #default="{ row }">
                    <ElCheckbox v-model="row.isQuery" size="large" true-value="1" false-value="0" />
                  </template>
                </ElTableColumn>
                <ElTableColumn label="查询方式" prop="queryType">
                  <template #default="{ row }">
                    <ElSelect v-model="row.queryType">
                      <ElOption
                        :label="item.label"
                        :value="item.value"
                        :key="item.value"
                        v-for="item in queryTypeOptions"
                      ></ElOption>
                    </ElSelect>
                  </template>
                </ElTableColumn>
                <ElTableColumn label="必填" prop="isRequired" width="80" align="center">
                  <template #default="{ row }">
                    <ElCheckbox
                      v-model="row.isRequired"
                      size="large"
                      true-value="1"
                      false-value="0"
                    />
                  </template>
                </ElTableColumn>
                <ElTableColumn label="显示类型" prop="htmlType" width="140" align="center">
                  <template #default="{ row }">
                    <ElSelect v-model="row.htmlType">
                      <ElOption
                        :label="item.label"
                        :value="item.value"
                        :key="item.value"
                        v-for="item in htmlTypeOptions"
                      ></ElOption>
                    </ElSelect>
                  </template>
                </ElTableColumn>
                <ElTableColumn label="字典类型" prop="dictType">
                  <template #default="{ row }">
                    <ElSelect v-model="row.dictType" clearable>
                      <ElOption
                        :label="item.dictName"
                        :value="item.dictType"
                        :key="item.dictId"
                        v-for="item in dictOptions"
                      >
                        <span style="float: left">{{ item.dictName }}</span>
                        <span style="float: right; font-size: 13px; color: #8492a6">{{
                          item.dictType
                        }}</span>
                      </ElOption>
                    </ElSelect>
                  </template>
                </ElTableColumn>
              </ElTable>
            </VueDraggable>
          </div>
        </ElTabPane>
        <ElTabPane label="生成信息" name="info">
          <GenInfo ref="GenInfoRef" :info="tableInfo.info" :tables="tableInfo.tables"></GenInfo>
        </ElTabPane>
      </ElTabs>
      <ElRow style="display: flex; justify-content: center; margin-top: 20px" v-if="tableInfo">
        <ElButton type="primary" size="default" @click="submitForm">提交</ElButton>
        <ElButton type="warning" size="default" @click="closePage">返回</ElButton>
      </ElRow>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { VueDraggable } from 'vue-draggable-plus'
  import { type GenInfo as GenInfoType, GenItem, GenService } from '@/api/tool/gen'
  import { DictType, DictTypeService } from '@/api/system/dict/type'
  import BasicInfo from './modules/basicInfo.vue'
  import GenInfo from './modules/genInfo.vue'
  import { useRoute, useRouter } from 'vue-router'
  import { FormInstance } from 'element-plus'
  import { useWorktabStore } from '@/store/modules/worktab'

  defineOptions({ name: 'GenEdit' })

  const route = useRoute()
  const router = useRouter()
  const worktabStore = useWorktabStore()

  // 接口
  const { getGenTable, updateGenTable } = GenService

  // 弹框显示
  const activeName = ref('column')

  const tableInfo = ref<GenInfoType>()
  const boxRef = ref<HTMLDivElement>()
  const loading = ref(false)

  const javaTypeOptions = [
    { label: 'Long', value: 'Long' },
    { label: 'String', value: 'String' },
    { label: 'Integer', value: 'Integer' },
    { label: 'Double', value: 'Double' },
    { label: 'BigDecimal', value: 'BigDecimal' },
    { label: 'Date', value: 'Date' },
    { label: 'Boolean', value: 'Boolean' }
  ]
  const queryTypeOptions = [
    { label: '=', value: 'EQ' },
    { label: '!=', value: 'NE' },
    { label: '>', value: 'GT' },
    { label: '>=', value: 'GTE' },
    { label: '<', value: 'LT' },
    { label: '<=', value: 'LTE' },
    { label: 'LIKE', value: 'LIKE' },
    { label: 'BETWEEN', value: 'BETWEEN' }
  ]
  const htmlTypeOptions = [
    { label: '文本框', value: 'input' },
    { label: '文本域', value: 'textarea' },
    { label: '下拉框', value: 'select' },
    { label: '单选框', value: 'radio' },
    { label: '复选框', value: 'checkbox' },
    { label: '日期控件', value: 'datetime' },
    { label: '图片上传', value: 'imageUpload' },
    { label: '文件上传', value: 'fileUpload' },
    { label: '富文本', value: 'editor' }
  ]
  const dictOptions = ref<DictType[]>([])

  /**获取字典列表 */
  const getDictList = async () => {
    try {
      const { data } = await DictTypeService.optionselect()
      dictOptions.value = data
    } catch {
      //
    }
  }
  getDictList()

  /**
   * 获取详情
   */
  const getInfo = async () => {
    loading.value = true
    const { tableId } = route.params
    if (!tableId) return
    try {
      const { data } = await getGenTable(tableId as unknown as number)
      tableInfo.value = data
    } finally {
      loading.value = false
    }
  }
  getInfo()

  const height = computed(() => {
    return boxRef.value?.clientHeight || 400
  })

  // 子组件ref
  const GenInfoRef = ref()
  const BasicInfoRef = ref()

  /**
   * 提交
   */
  const submitForm = async () => {
    const form1 = GenInfoRef.value?.genInfoRef
    const form2 = BasicInfoRef.value?.basicInfoRef
    try {
      const validateResult = await Promise.all([form1, form2].map(formValidate))
      const result = validateResult.every((item) => !!item)
      if (result) {
        const data: { params?: Record<string, unknown> } & GenItem = Object.assign(
          {},
          tableInfo.value?.info
        )
        data.columns =
          tableInfo.value?.rows.map((item, index) => ({
            ...item,
            sort: index + 1
          })) || []
        data.params = {
          treeCode: data.treeCode,
          treeName: data.treeName,
          treeParentCode: data.treeParentCode,
          parentMenuId: data.parentMenuId
        }
        await updateGenTable(data)
        closePage()
      } else {
        activeName.value = validateResult[0] ? 'basic' : 'info'
        // ElMessage.warning()
      }
    } catch (err) {
      console.error('表单验证失败', err)
    }
  }

  const formValidate = (form?: FormInstance) => {
    return new Promise((resolve) => {
      if (!form) return resolve(false)
      form.validate((valid) => {
        resolve(valid)
      })
    })
  }

  /**
   * 关闭当前页面
   */
  const closePage = () => {
    worktabStore.removeTab(route.path)
    router.push({ path: '/tool/gen' })
  }
</script>

<style lang="scss" scoped>
  .table-con {
    height: calc(var(--art-full-height) - 170px);
  }
</style>
