<!-- 导入 Excel 文件 -->
<template>
  <div style="margin: 0 12px">
    <ElButton type="info" v-ripple plain @click="dialogVisible = true">
      <slot>导入</slot>
    </ElButton>
    <ElDialog v-model="dialogVisible" :title="title || '导入'" width="30%" align-center>
      <ElUpload
        :key="dialogVisible + ''"
        class="upload-demo"
        drag
        :auto-upload="false"
        accept=".xls,.xlsx"
        :action="options.importUrl + '?updateSupport=' + (!updateSupport ? '0' : '1')"
        :limit="1"
        :on-progress="handleFileUploadProgress"
        :on-success="handleFileSuccess"
        ref="uploadRef"
        :headers="header"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text"> 将文件拖到此处，或<em>点击上传</em> </div>
        <template #tip>
          <div class="el-upload__tip">
            <ElCheckbox v-model="updateSupport">是否更新已经存在的用户数据</ElCheckbox>
            <p
              >仅允许导入xls、xlsx格式文件。<ElButton type="primary" link @click="importTemplate"
                >下载模板</ElButton
              ></p
            >
          </div>
        </template>
      </ElUpload>
      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="dialogVisible = false">取消</ElButton>
          <ElButton type="primary" @click="handleSubmit">提交</ElButton>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ElMessageBox } from 'element-plus'
  import { downloadFile } from '@/utils'
  import { useUserStore } from '@/store/modules/user'

  defineOptions({ name: 'MdExcelImport' })
  // 定义 emits
  const emit = defineEmits<{
    'import-success': [data: any]
    'import-error': [error: Error]
  }>()

  const props = defineProps<{
    title: string
    type?: 'info' | 'default' | 'primary' | 'success' | 'warning' | 'danger' | '' | 'text'
    options: {
      importUrl: string
      templateUrl: string
      templateName: string
    }
  }>()

  const { accessToken } = useUserStore()

  const header = {
    Authorization: 'Bearer ' + accessToken
  }

  const uploadRef = ref<any>(null)
  const dialogVisible = ref(false)
  const updateSupport = ref(false)

  /**
   * 下载模板
   */
  function importTemplate() {
    downloadFile(props.options.templateUrl, {}, props.options.templateName)
  }

  const isUploading = ref(false)

  /**
   * 上传中
   */
  function handleFileUploadProgress() {
    isUploading.value = true
  }

  /**
   * 上传成功
   * @param response
   */
  function handleFileSuccess(response: Api.Common.DataResponse) {
    dialogVisible.value = false
    isUploading.value = false
    ElMessageBox.alert(
      "<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" +
        response.msg +
        '</div>',
      '导入结果',
      { dangerouslyUseHTMLString: true }
    )
    emit('import-success', response.msg)
  }

  // 上传
  function handleSubmit() {
    uploadRef.value?.submit()
  }
</script>

<style scoped>
  .excel-uploader {
    display: inline-block;
  }

  .el-upload__tip {
    text-align: center;

    p {
      margin-top: -10px;
    }
  }
</style>
