/**
 * 文本过滤工具函数
 * 用于过滤表情标签和其他特殊格式的文本
 */

/**
 * 过滤掉方括号包围的表情标签，如 [happy], [sad], [angry] 等
 * @param text - 原始文本
 * @returns 过滤后的文本
 */
export function filterEmotionTags(text: string): string {
  if (!text) return text;
  
  // 使用正则表达式匹配方括号包围的内容，通常是表情标签
  // 匹配模式: [任意非方括号字符]
  return text.replace(/\[[^\]]*\]/g, '').trim();
}

/**
 * 检查文本是否只包含表情标签（用于判断是否完全隐藏）
 * @param text - 原始文本
 * @returns 如果文本只包含表情标签返回 true
 */
export function isOnlyEmotionTags(text: string): boolean {
  if (!text) return false;
  
  // 移除所有表情标签后，检查是否还有其他内容
  const filteredText = filterEmotionTags(text);
  return filteredText.length === 0;
}

/**
 * 综合文本过滤函数
 * @param text - 原始文本
 * @returns 过滤后的文本，如果原文只包含表情标签则返回空字符串
 */
export function filterDisplayText(text: string): string {
  if (!text) return text;
  
  const filteredText = filterEmotionTags(text);
  
  // 如果过滤后没有内容，返回空字符串
  return filteredText.length > 0 ? filteredText : '';
}