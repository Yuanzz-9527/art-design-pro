import axios, { AxiosResponse } from 'axios'
import { ElLoading, ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import { saveAs } from 'file-saver'

const { VITE_API_URL: baseURL } = import.meta.env

/** 校验是否为 Blob（二进制流）而不是 JSON */
const blobValidate = (data: Blob): boolean => {
  return data.type !== 'application/json'
}

/** 打印后端返回的 JSON 错误信息 */
const printErrMsg = async (data: Blob): Promise<void> => {
  const resText = await data.text()
  try {
    const rspObj = JSON.parse(resText)
    ElMessage.error(rspObj.msg || '下载失败')
  } catch {
    ElMessage.error('文件下载出错，请联系管理员！')
  }
}

export interface DownloadApi {
  /** 下载指定文件 */
  name: (name: string, isDelete?: boolean) => Promise<void>
  /** 下载静态资源 */
  resource: (resource: string) => Promise<void>
  /** 下载 ZIP 文件 */
  zip: (url: string, name: string) => Promise<void>
}

const downloadApi: DownloadApi = {
  async name(name: string, isDelete = true): Promise<void> {
    const { accessToken } = useUserStore()
    const url = `${baseURL}/common/download?fileName=${encodeURIComponent(name)}&delete=${isDelete}`

    try {
      const res: AxiosResponse<Blob> = await axios({
        method: 'get',
        url,
        responseType: 'blob',
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const isBlob = blobValidate(res.data)
      if (isBlob) {
        const blob = new Blob([res.data])
        saveAs(blob, decodeURIComponent(res.headers['download-filename']))
      } else {
        await printErrMsg(res.data)
      }
    } catch (err) {
      console.error(err)
      ElMessage.error('文件下载失败')
    }
  },

  async resource(resource: string): Promise<void> {
    const { accessToken } = useUserStore()
    const url = `${baseURL}/common/download/resource?resource=${encodeURIComponent(resource)}`
    try {
      const res: AxiosResponse<Blob> = await axios({
        method: 'get',
        url,
        responseType: 'blob',
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const isBlob = blobValidate(res.data)
      if (isBlob) {
        const blob = new Blob([res.data])
        saveAs(blob, decodeURIComponent(res.headers['download-filename']))
      } else {
        await printErrMsg(res.data)
      }
    } catch (err) {
      console.error(err)
      ElMessage.error('资源下载失败')
    }
  },

  async zip(url: string, name: string): Promise<void> {
    const { accessToken } = useUserStore()
    const url_ = `${baseURL}${url}`
    const downloadLoadingInstance = ElLoading.service({
      text: '正在下载数据，请稍候',
      spinner: 'el-icon-loading',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    try {
      const res: AxiosResponse<Blob> = await axios({
        method: 'get',
        url: url_,
        responseType: 'blob',
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const isBlob = blobValidate(res.data)
      if (isBlob) {
        const blob = new Blob([res.data], { type: 'application/zip' })
        saveAs(blob, name)
      } else {
        await printErrMsg(res.data)
      }
    } catch (err) {
      console.error(err)
      ElMessage.error('下载文件出现错误，请联系管理员！')
    } finally {
      downloadLoadingInstance.close()
    }
  }
}

export default downloadApi
