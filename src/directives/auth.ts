import { App, Directive, DirectiveBinding } from 'vue'
import { useUserStore } from '@/store/modules/user'

/**
 * 权限指令（后端控制模式可用）
 * 用法：
 * <el-button v-auth="'add'">按钮</el-button>
 */

interface AuthBinding extends DirectiveBinding {
  value: string
}

function checkAuthPermission(el: HTMLElement, binding: AuthBinding): void {
  // 获取当前路由的权限列表
  const useUser = useUserStore()
  const authList = useUser.permissions || []

  // *:*:* 拥有全部权限
  if (authList.length === 1 && authList[0] === '*:*:*') return

  // 确保指令值为数组格式
  const requiredPermissions = Array.isArray(binding.value) ? binding.value : [binding.value]

  // 命中任意一个即为显示
  const hasPermission = requiredPermissions.some((per: string) => authList.includes(per))
  // 如果没有权限，移除元素
  if (!hasPermission) {
    removeElement(el)
  }
}

function removeElement(el: HTMLElement): void {
  if (el.parentNode) {
    el.parentNode.removeChild(el)
  }
}

const authDirective: Directive = {
  mounted: checkAuthPermission,
  updated: checkAuthPermission
}

export function setupAuthDirective(app: App): void {
  app.directive('auth', authDirective)
}
