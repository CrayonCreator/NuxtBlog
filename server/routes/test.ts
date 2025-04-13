import { eventHandler } from 'h3'

export default eventHandler(() => {
  return { message: 'API系统工作正常' }
})