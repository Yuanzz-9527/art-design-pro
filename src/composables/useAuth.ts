import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/modules/user'
import { useCommon } from '@/composables/useCommon'
import type { AppRouteRecord } from '@/types/router'

type AuthItem = NonNullable<AppRouteRecord['meta']['authList']>[number]

const userStore = useUserStore()

/**
 * 按钮权限（前后端模式通用）
 * 用法：
 * const { hasAuth } = useAuth()
 * hasAuth('add') // 检查是否拥有新增权限
 */
export const useAuth = () => {
  const route = useRoute()
  const { isFrontendMode } = useCommon()
  const { permissions } = storeToRefs(userStore)

  // 按钮权限 接口获取
  const frontendAuthList = permissions?.value ?? []

  // 路由 meta 配置的权限列表（例如：[{ authMark: 'add' }]）
  const mateAuthList: AuthItem[] = Array.isArray(route.meta.authList)
    ? (route.meta.authList as AuthItem[])
    : []

  /**
   * 检查是否拥有某权限标识（前后端模式通用）
   * @param auth 权限标识
   * @returns 是否有权限
   */
  const hasAuth = (auth: string): boolean => {
    // 接口模式
    if (!isFrontendMode.value) {
      if (frontendAuthList.length === 1 && frontendAuthList[0] === '*:*:*') return true
      return frontendAuthList.includes(auth)
    }

    // meta模式
    return mateAuthList.some((item) => item?.authMark === auth)
  }

  const hasAuths = (auths: string[]): boolean => {
    // 接口模式
    if (!isFrontendMode.value) {
      if (frontendAuthList.length === 1 && frontendAuthList[0] === '*:*:*') return true
      return auths.some((auth) => frontendAuthList.includes(auth))
    }
    // meta模式
    return auths.some((auth) => mateAuthList.some((item) => item?.authMark === auth))
  }

  return {
    hasAuth,
    hasAuths
  }
}
