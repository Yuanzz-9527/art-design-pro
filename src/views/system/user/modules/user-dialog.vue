<template>
  <ElDialog
    v-model="dialogVisible"
    :title="dialogType === 'add' ? '添加用户' : '编辑用户'"
    width="35%"
    align-center
    :close-on-click-modal="false"
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="80px">
      <ElRow>
        <ElCol :md="12">
          <ElFormItem label="用户昵称" prop="nickName">
            <ElInput v-model="formData.nickName" placeholder="请输入用户昵称" />
          </ElFormItem>
        </ElCol>
        <ElCol :md="12">
          <ElFormItem label="归属部门" prop="deptId">
            <ElTreeSelect
              v-model="formData.deptId"
              :data="deptTree"
              check-strictly
              node-key="id"
              placeholder="请选择归属部门"
              :render-after-expand="false"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :md="12">
          <ElFormItem label="手机号码" prop="phonenumber">
            <ElInput v-model="formData.phonenumber" placeholder="请输入手机号码" />
          </ElFormItem>
        </ElCol>
        <ElCol :md="12">
          <ElFormItem label="电子邮箱" prop="email">
            <ElInput v-model="formData.email" placeholder="请输入电子邮箱" />
          </ElFormItem>
        </ElCol>
        <ElCol :md="12">
          <ElFormItem label="用户账号" prop="userName">
            <ElInput v-model="formData.userName" placeholder="请输入用户账号" />
          </ElFormItem>
        </ElCol>
        <ElCol :md="12" v-if="type === 'add'">
          <ElFormItem label="用户密码" prop="password">
            <ElInput type="password" v-model="formData.password" placeholder="请输入用户密码" />
          </ElFormItem>
        </ElCol>
        <ElCol :md="12">
          <ElFormItem label="用户性别" prop="sex">
            <ElSelect v-model="formData.sex">
              <ElOption
                v-for="dic in dict.sys_user_sex"
                :key="dic.value"
                :value="dic.value"
                :label="dic.label"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :md="12">
          <ElFormItem label="用户状态" prop="status">
            <ElRadioGroup v-model="formData.status">
              <ElRadio :value="dic.value" v-for="dic in dict.sys_normal_disable" :key="dic.value">{{
                dic.label
              }}</ElRadio>
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>
        <ElCol :md="12">
          <ElFormItem label="岗 位" prop="postIds">
            <ElSelect v-model="formData.postIds" multiple>
              <ElOption
                v-for="role in postList"
                :key="role.postId"
                :value="role.postId"
                :label="role.postName"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :md="12">
          <ElFormItem label="角 色" prop="roleIds">
            <ElSelect v-model="formData.roleIds" multiple>
              <ElOption
                v-for="role in roleList"
                :key="role.roleId"
                :value="role.roleId"
                :label="role.roleName"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol>
          <ElFormItem label="备 注" prop="remark">
            <ElInput type="textarea" v-model="formData.remark" placeholder="请输入备注" />
          </ElFormItem>
        </ElCol>
      </ElRow>
    </ElForm>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules, TreeData } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import useDict from '@/composables/useDict'
  import { UserService, type User } from '@/api/system/user'

  interface Props {
    visible: boolean
    type: string
    userData?: any
    deptTree?: TreeData
    roleList?: Record<string, any>[]
    postList?: Record<string, any>[]
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const { dict } = useDict(['sys_user_sex', 'sys_normal_disable'])

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const dialogType = computed(() => props.type)

  // 表单实例
  const formRef = ref<FormInstance>()

  // 表单数据
  const initialForm: Partial<User> = {
    email: '',
    deptId: undefined,
    sex: '0',
    roleIds: [],
    postIds: [],
    status: '0',
    phonenumber: '',
    nickName: '',
    userName: '',
    password: '',
    remark: ''
  }
  const formData = reactive<Partial<User>>({ ...initialForm })

  // 表单验证规则
  const rules: FormRules = {
    userName: [
      { required: true, message: '请输入用户账号', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    phonenumber: [
      // { required: true, message: '请输入手机号', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
    ],
    email: [{ type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }],
    password: [
      { required: true, message: '请输入用户密码', trigger: 'blur' },
      { min: 8, max: 20, message: '长度在 8 到 20个字符', trigger: 'blur' },
      {
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[._~!@#$^&*])[A-Za-z\d._~!@#$^&*]+$/,
        message: '密码由大写字母、小写字母、数字、特殊符号组成，特殊符号包含 . _ ~ ! @ # $ ^ & *',
        trigger: 'blur'
      }
    ],
    sex: [{ required: true, message: '请选择性别', trigger: 'blur' }],
    deptId: [{ required: true, message: '请选择所属部门', trigger: 'blur' }],
    roleIds: [{ required: true, message: '请选择角色', trigger: 'blur' }],
    // postIds: [{ required: true, message: '请选择岗位', trigger: 'blur' }],
    nickName: [{ required: true, message: '请输入用户昵称', trigger: 'blur' }]
  }

  // 初始化表单数据
  const initFormData = () => {
    const isEdit = props.type === 'edit' && props.userData
    if (isEdit) {
      Object.assign(formData, props.userData)
    } else {
      Object.assign(formData, initialForm)
    }
  }

  // 统一监听对话框状态变化
  watch(
    () => [props.visible, props.type, props.userData],
    ([visible]) => {
      if (visible) {
        initFormData()
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    },
    { immediate: true }
  )

  // 提交表单
  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (valid) {
        try {
          if (props.type === 'edit' && formData.userId) {
            await UserService.updateUser(formData)
          } else {
            await UserService.addUser(formData)
          }
          ElMessage.success(dialogType.value === 'add' ? '添加成功' : '更新成功')
          dialogVisible.value = false
          emit('submit')
        } catch (error) {
          console.log(error)
        }
      }
    })
  }
</script>
