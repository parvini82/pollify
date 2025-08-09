import axios from 'axios'
export const http = axios.create({ baseURL: '/' }) // proxy → 3000

export function errMsg(e: unknown) {
  if (axios.isAxiosError(e)) return e.response?.data?.error || e.message
  return (e as Error)?.message || 'Unknown error'
}
