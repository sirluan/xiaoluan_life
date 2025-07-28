import request from '@/utils/request.js';

/**
 * 笔记相关API
 */

/**
 * 获取文章列表
 * @param {Object} params - 请求参数
 * @param {number} params.page - 页码，默认1
 * @param {number} params.limit - 每页数量，默认20
 * @param {string} params.category - 分类名称
 * @param {string} params.search - 搜索关键词
 * @returns {Promise} 返回文章列表数据
 */
export const getNotesList = (params = {}) => {
  const { page = 1, limit = 20, category, search } = params;
  
  // 手动构建查询字符串，避免使用URLSearchParams
  const queryParts = [
    `page=${page}`,
    `limit=${limit}`
  ];
  
  if (category) queryParts.push(`category=${encodeURIComponent(category)}`);
  if (search) queryParts.push(`search=${encodeURIComponent(search)}`);
  
  const queryString = queryParts.join('&');
  
  return request({
    url: `/api/notes?${queryString}`,
    method: 'GET'
  });
};

/**
 * 获取单个文章详情
 * @param {number} noteId - 文章ID
 * @returns {Promise} 返回文章详情数据
 */
export const getNoteDetail = (noteId) => {
  return request({
    url: `/api/notes/search/${noteId}`,
    method: 'GET'
  });
};

/**
 * 获取分类列表
 * @returns {Promise} 返回分类列表数据
 */
export const getCategories = () => {
  return request({
    url: '/api/notes/categories',
    method: 'GET'
  });
};

/**
 * 格式化文章数据
 * @param {Object} item - 原始文章数据
 * @returns {Object} 格式化后的文章数据
 */
export const formatNoteItem = (item) => {
  return {
    id: item.id,
    title: item.post_title,
    content: item.post_content,
    category: item.post_name,
    created_at: item.post_date,
    // 从HTML内容中提取纯文本作为预览
    preview: extractTextFromHTML(item.post_content)
  };
};

/**
 * 从HTML内容中提取纯文本
 * @param {string} html - HTML内容
 * @param {number} maxLength - 最大长度，默认100
 * @returns {string} 提取的纯文本
 */
export const extractTextFromHTML = (html, maxLength = 100) => {
  if (!html) return '';
  
  // 移除HTML标签
  let text = html.replace(/<[^>]*>/g, '');
  
  // 移除多余的空格和换行
  text = text.replace(/\s+/g, ' ').trim();
  
  // 限制长度
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '...';
  }
  
  return text;
};

/**
 * 格式化时间
 * @param {string} dateStr - 日期字符串
 * @returns {string} 格式化后的时间
 */
export const formatTime = (dateStr) => {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  // 小于1分钟
  if (diff < 60000) {
    return '刚刚';
  }
  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  }
  // 小于24小时
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  }
  // 小于30天
  if (diff < 2592000000) {
    return `${Math.floor(diff / 86400000)}天前`;
  }
  
  // 超过30天显示具体日期
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}; 

/**
 * 根据分类获取笔记列表（支持分页）
 * @param {string} category_name - 分类名称
 * @param {number} page - 页码，默认1
 * @param {number} limit - 每页数量，默认20
 * @returns {Promise} 返回分页的笔记列表数据
 */
export const getNoteDetail_bycategory = (category_name, page = 1, limit = 20) => {
  // 手动构建查询字符串，避免使用URLSearchParams
  const queryString = `page=${page}&limit=${limit}`;
  
  return request({
    url: `/api/notes/category/${category_name}?${queryString}`,
    method: 'GET'
  });
};
