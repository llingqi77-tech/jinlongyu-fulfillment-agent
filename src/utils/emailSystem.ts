export const EMAIL_PARSE_TODAY_PROMPT = '解析今天的订单信息'

/** 邮件系统开启时，识别「解析今日/今天订单」类指令 */
export function isEmailParseTodayCommand(text: string): boolean {
  const normalized = text.replace(/\s/g, '')
  if (normalized.includes(EMAIL_PARSE_TODAY_PROMPT.replace(/\s/g, ''))) return true
  if (normalized.includes('解析今日订单')) return true
  return /解析.*(今天|今日).*(订单|邮件)/.test(normalized)
}
