<template>
  <div class="rich-text-viewer">
    <!-- 使用WangEditor的只读模式展示富文本 -->
    <div class="editor-container">
      <Editor
        :defaultConfig="editorConfig"
        :mode="mode"
        v-model="valueHtml"
        @onCreated="handleCreated"
        style="height: auto; min-height: 200px; overflow-y: hidden;"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, onBeforeUnmount, watch, nextTick } from 'vue';
import '@wangeditor/editor/dist/css/style.css';
import { Editor } from '@wangeditor/editor-for-vue';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
});

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef();

// 内容 HTML
const valueHtml = ref('');

// 编辑器模式
const mode = ref('default');

// 编辑器配置 - 只读模式
const editorConfig = {
  placeholder: '',
  readOnly: true, // 设置为只读模式
  autoFocus: false,
  MENU_CONF: {},
  // 禁用所有菜单
  toolbarKeys: [],
  // 隐藏工具栏
  showToolbar: false,
  // 允许所有HTML标签
  EXTEND_CONF: {
    mentionConfig: {
      showModal: false
    }
  }
};

// 渲染数学公式
const renderMathFormulas = () => {
  nextTick(() => {
    const editor = editorRef.value;
    if (!editor) return;
    
    const textContainer = editor.getEditableContainer();
    if (!textContainer) return;
    
    // 处理图片错误
    handleImageErrors(textContainer);
    
    // 渲染行内公式 $...$
    const inlineMathElements = textContainer.querySelectorAll('.math-inline');
    inlineMathElements.forEach((element, index) => {
      try {
        const tex = element.getAttribute('data-tex');
        if (tex) {
          katex.render(tex, element, {
            throwOnError: false,
            displayMode: false
          });
        }
      } catch (error) {
        console.error('渲染行内公式失败:', error);
        element.textContent = element.getAttribute('data-tex') || '';
      }
    });
    
    // 渲染块级公式 $$...$$
    const blockMathElements = textContainer.querySelectorAll('.math-block');
    blockMathElements.forEach((element, index) => {
      try {
        const tex = element.getAttribute('data-tex');
        if (tex) {
          katex.render(tex, element, {
            throwOnError: false,
            displayMode: true
          });
        }
      } catch (error) {
        console.error('渲染块级公式失败:', error);
        element.textContent = element.getAttribute('data-tex') || '';
      }
    });
  });
};

// 处理图片错误
const handleImageErrors = (container) => {
  try {
    const images = container.querySelectorAll('img');
    const imageUrls = [];
    
    // 收集所有图片URL
    images.forEach(img => {
      if (img.src) {
        imageUrls.push(img.src);
      }
    });
    
    images.forEach((img, index) => {
      // 检查图片是否已经有错误处理
      if (!img.hasAttribute('data-error-handled')) {
        // 为图片添加错误处理
        img.onerror = function() {
          // 图片加载失败时，隐藏图片
          this.style.display = 'none';
        };
        
        // 为图片添加加载处理
        img.onload = function() {
          // 图片加载成功时显示
          this.style.display = 'block';
        };
        
        // 设置默认样式
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.width = 'auto';
        img.style.borderRadius = '8px';
        img.style.margin = '8px 0';
        img.style.display = 'block';
        img.style.cursor = 'pointer';
        
        // 移除之前的事件监听器
        img.removeEventListener('click', img._previewHandler);
        
        // 为微信小程序添加点击放大功能
        img._previewHandler = function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log('图片被点击:', this.src);
          
          // 使用微信小程序的预览图片API
          // #ifdef MP-WEIXIN
          uni.previewImage({
            current: this.src,
            urls: imageUrls,
            success: function(res) {
              console.log('预览成功');
            },
            fail: function(err) {
              console.error('预览失败:', err);
            }
          });
          // #endif
          // #ifndef MP-WEIXIN
          // 非微信小程序环境，可以添加其他预览逻辑
          console.log('点击图片:', this.src);
          // #endif
        };
        
        img.addEventListener('click', img._previewHandler);
        
        // 添加触摸事件支持（微信小程序）
        img.addEventListener('touchstart', function(e) {
          console.log('图片触摸开始:', this.src);
        });
        
        // 标记为已处理
        img.setAttribute('data-error-handled', 'true');
      }
    });
  } catch (error) {
    console.error('处理图片错误时出错:', error);
  }
};

// 处理数学公式标记
const processMathFormulas = (html) => {
  if (!html) return html;
  
  console.log('处理前的HTML:', html);
  
  let processedHtml = html;
  
  // 处理行内公式 $...$ - 使用更简单的替换
  processedHtml = processedHtml.replace(/\$([^$\n]+?)\$/g, (match, tex) => {
    console.log('处理行内公式:', tex);
    return `<span class="math-inline" data-tex="${tex.replace(/"/g, '&quot;')}">${tex}</span>`;
  });
  
  // 处理块级公式 $$...$$ - 使用更简单的替换
  processedHtml = processedHtml.replace(/\$\$([^$\n]+?)\$\$/g, (match, tex) => {
    console.log('处理块级公式:', tex);
    return `<div class="math-block" data-tex="${tex.replace(/"/g, '&quot;')}">${tex}</div>`;
  });
  
  console.log('处理后的HTML:', processedHtml);
  return processedHtml;
};

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.destroy();
});

// 监听content变化
watch(() => props.content, (newContent) => {
  if (newContent) {
    // 检查是否是JSON格式的内容
    if (newContent.trim().startsWith('{') || newContent.trim().startsWith('[')) {
      console.warn('RichTextViewer: 检测到JSON格式内容，转换为HTML格式');
      const processedContent = convertJsonToHtml(newContent);
      valueHtml.value = processedContent;
    } else {
      const processedContent = processMathFormulas(newContent);
      valueHtml.value = processedContent;
    }
    // 延迟渲染数学公式，确保DOM已更新
    setTimeout(renderMathFormulas, 200);
  } else {
    valueHtml.value = '';
  }
}, { immediate: true });

// 将JSON格式转换为HTML
const convertJsonToHtml = (jsonContent) => {
  try {
    const data = JSON.parse(jsonContent);
    let html = '<div>';
    
    if (Array.isArray(data.children)) {
      data.children.forEach(child => {
        html += convertNodeToHtml(child);
      });
    } else if (data.children) {
      html += convertNodeToHtml(data);
    } else {
      // 如果不是标准格式，直接显示文本
      html += `<p>${JSON.stringify(data, null, 2)}</p>`;
    }
    
    html += '</div>';
    return html;
  } catch (error) {
    console.error('RichTextViewer: 转换JSON到HTML失败:', error);
    // 如果转换失败，返回原始内容作为纯文本
    return `<div><p>${jsonContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p></div>`;
  }
};

// 转换节点为HTML
const convertNodeToHtml = (node) => {
  if (!node || !node.type) return '';
  
  let html = '';
  const text = node.children ? node.children.map(child => child.text || '').join('') : '';
  
  switch (node.type) {
    case 'paragraph':
      html = `<p>${text}</p>`;
      break;
    case 'header1':
      html = `<h1>${text}</h1>`;
      break;
    case 'header2':
      html = `<h2>${text}</h2>`;
      break;
    case 'header3':
      html = `<h3>${text}</h3>`;
      break;
    case 'header4':
      html = `<h4>${text}</h4>`;
      break;
    case 'header5':
      html = `<h5>${text}</h5>`;
      break;
    case 'header6':
      html = `<h6>${text}</h6>`;
      break;
    case 'list':
      html = `<ul>${node.children ? node.children.map(child => `<li>${child.text || ''}</li>`).join('') : ''}</ul>`;
      break;
    case 'ordered-list':
      html = `<ol>${node.children ? node.children.map(child => `<li>${child.text || ''}</li>`).join('') : ''}</ol>`;
      break;
    case 'blockquote':
      html = `<blockquote>${text}</blockquote>`;
      break;
    case 'code':
      html = `<pre><code>${text}</code></pre>`;
      break;
    case 'image':
      const src = node.src || '';
      html = `<img src="${src}" alt="${text}" onerror="this.style.display='none'" style="max-width:100%;height:auto;width:auto;border-radius:8px;margin:8px 0;cursor:pointer;display:block;vertical-align:middle;">`;
      break;
    default:
      html = `<p>${text}</p>`;
  }
  
  return html;
};

const handleCreated = (editor) => {
  editorRef.value = editor; // 记录 editor 实例，重要！
  console.log('编辑器创建完成');
  // 编辑器创建后渲染数学公式
  setTimeout(renderMathFormulas, 200);
};
</script>

<style>
.rich-text-viewer {
  width: 100%;
}

.editor-container {
  width: 100%;
  border: none;
  border-radius: 8px;
  overflow: hidden;
}

/* 隐藏工具栏 */
.w-e-toolbar {
  display: none !important;
}

/* 自定义编辑器样式 */
.w-e-text-container {
  background-color: transparent !important;
  border: none !important;
}

.w-e-text {
  padding: 0 !important;
  line-height: 1.7 !important;
  font-size: 16px !important;
  background: transparent !important;
  color: #333 !important;
}

/* 代码块样式 */
.w-e-text pre {
  background: #f1f8e9 !important;
  border-radius: 8px !important;
  padding: 16px !important;
  font-family: 'Courier New', monospace !important;
  font-size: 15px !important;
  white-space: pre-wrap !important;
  word-break: break-all !important;
  overflow-x: auto !important;
  margin: 8px 0 !important;
  border-left: 4px solid #4CAF50 !important;
}

.w-e-text code {
  font-family: 'Courier New', monospace !important;
  font-size: 15px !important;
  background: #f1f8e9 !important;
  color: #2e7d32 !important;
  border-radius: 4px !important;
  padding: 2px 6px !important;
  margin: 0 2px !important;
  border: 1px solid #c8e6c9 !important;
}

/* 标题样式 */
.w-e-text h1, .w-e-text h2, .w-e-text h3, .w-e-text h4, .w-e-text h5, .w-e-text h6 {
  margin: 16px 0 8px 0 !important;
  font-weight: bold !important;
  color: #2e7d32 !important;
}

.w-e-text h1 { font-size: 24px !important; }
.w-e-text h2 { font-size: 22px !important; }
.w-e-text h3 { font-size: 18px !important; }
.w-e-text h4 { font-size: 16px !important; }
.w-e-text h5 { font-size: 14px !important; }
.w-e-text h6 { font-size: 12px !important; }

/* 段落样式 */
.w-e-text p {
  margin: 10px 0 !important;
  line-height: 1.7 !important;
  color: #555 !important;
}

/* 列表样式 */
.w-e-text ul, .w-e-text ol {
  margin: 10px 0 10px 20px !important;
  padding-left: 20px !important;
}

.w-e-text li {
  margin: 5px 0 !important;
  line-height: 1.7 !important;
  color: #555 !important;
}

/* 表格样式 */
.w-e-text table {
  width: 100% !important;
  border-collapse: collapse !important;
  margin: 15px 0 !important;
  border-radius: 8px !important;
  overflow: hidden !important;
  box-shadow: 0 2rpx 8rpx rgba(76, 175, 80, 0.1) !important;
}

.w-e-text th, .w-e-text td {
  border: 1px solid #e8f5e8 !important;
  padding: 12px 8px !important;
}

.w-e-text th {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%) !important;
  color: white !important;
  font-weight: bold !important;
}

.w-e-text td {
  background: white !important;
}

.w-e-text tr:nth-child(even) td {
  background: #f8faf8 !important;
}

/* 强调文本 */
.w-e-text strong {
  font-weight: bold !important;
  color: #2e7d32 !important;
}

.w-e-text em {
  font-style: italic !important;
  color: #4CAF50 !important;
}

/* 链接样式 */
.w-e-text a {
  color: #4CAF50 !important;
  text-decoration: none !important;
  border-bottom: 1px solid transparent !important;
  transition: all 0.3s ease !important;
}

.w-e-text a:hover {
  color: #2e7d32 !important;
  border-bottom-color: #4CAF50 !important;
}

/* 引用样式 */
.w-e-text blockquote {
  border-left: 4px solid #4CAF50 !important;
  padding-left: 16px !important;
  margin: 16px 0 !important;
  color: #666 !important;
  font-style: italic !important;
  background: #f8faf8 !important;
  border-radius: 0 8px 8px 0 !important;
  padding: 16px !important;
}

/* 图片样式 */
.w-e-text img {
  border-radius: 8px !important;
  box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.1) !important;
  border: 2px solid #e8f5e8 !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
}

.w-e-text img:hover {
  transform: scale(1.02) !important;
  box-shadow: 0 6rpx 16rpx rgba(76, 175, 80, 0.2) !important;
}

/* 图片容器样式 */
.w-e-text p {
  overflow: visible !important;
  word-wrap: break-word !important;
}

/* 确保图片不被截断 */
.w-e-text {
  overflow: visible !important;
  word-wrap: break-word !important;
}

/* 强制图片完整显示 */
.w-e-text img {
  box-sizing: border-box !important;
  max-width: 100% !important;
  width: auto !important;
  height: auto !important;
  display: block !important;
  margin: 8px auto !important;
  vertical-align: middle !important;
  overflow: visible !important;
  position: relative !important;
  z-index: 1 !important;
}

/* 确保容器不会截断图片 */
.w-e-text-container {
  overflow: visible !important;
}

.w-e-text-container .w-e-text {
  overflow: visible !important;
}

/* 分割线样式 */
.w-e-text hr {
  border: none !important;
  border-top: 2px solid #e8f5e8 !important;
  margin: 20px 0 !important;
  position: relative !important;
}

.w-e-text hr::after {
  content: '🌿' !important;
  position: absolute !important;
  top: -10px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  background: white !important;
  padding: 0 10px !important;
  color: #4CAF50 !important;
  font-size: 16px !important;
}

/* 移除编辑器边框和背景 */
.w-e-text-container {
  border: none !important;
  background: transparent !important;
}

.w-e-text-container .w-e-text {
  border: none !important;
  background: transparent !important;
}

/* 特殊元素样式 */
.w-e-text mark {
  background: #f1f8e9 !important;
  color: #2e7d32 !important;
  padding: 2px 4px !important;
  border-radius: 4px !important;
}

.w-e-text del {
  color: #999 !important;
  text-decoration: line-through !important;
}

.w-e-text ins {
  color: #4CAF50 !important;
  text-decoration: underline !important;
}

/* 数学公式样式 */
.math-inline {
  display: inline-block !important;
  margin: 0 2px !important;
  padding: 2px 4px !important;
  background: #f8faf8 !important;
  border-radius: 4px !important;
  border: 1px solid #e8f5e8 !important;
  font-size: 14px !important;
}

.math-block {
  display: block !important;
  margin: 16px 0 !important;
  padding: 16px !important;
  background: #f8faf8 !important;
  border-radius: 8px !important;
  border: 2px solid #e8f5e8 !important;
  text-align: center !important;
  overflow-x: auto !important;
  box-shadow: 0 2rpx 8rpx rgba(76, 175, 80, 0.1) !important;
}

/* KaTeX 样式覆盖 */
.katex {
  font-size: 1em !important;
  color: #2e7d32 !important;
}

.katex-display {
  margin: 0 !important;
  padding: 0 !important;
}

.katex-html {
  font-size: 1em !important;
}

/* 数学公式容器样式 */
.math-inline .katex {
  font-size: 0.9em !important;
}

.math-block .katex {
  font-size: 1.1em !important;
}
</style> 