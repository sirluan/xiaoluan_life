<template>
  <view class="simple-text-viewer">
    <rich-text :nodes="processedContent" @tap="handleTap"></rich-text>
  </view>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
});

const processedContent = ref('');

// 处理内容
const processContent = (content) => {
  if (!content) return '';
  
  try {
    // 检查是否是JSON格式的内容
    if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
      console.warn('SimpleTextViewer: 检测到JSON格式内容，转换为HTML格式');
      return convertJsonToHtml(content);
    }
    
    // 处理数学公式
    let processed = content;
    
    // 处理行内公式 $...$
    processed = processed.replace(/\$([^$\n]+?)\$/g, (match, tex) => {
      try {
        return katex.renderToString(tex, {
          throwOnError: false,
          displayMode: false
        });
      } catch (error) {
        console.error('渲染行内公式失败:', error);
        return `<span style="color: #999; font-style: italic;">[公式: ${tex}]</span>`;
      }
    });
    
    // 处理块级公式 $$...$$
    processed = processed.replace(/\$\$([^$\n]+?)\$\$/g, (match, tex) => {
      try {
        return `<div style="text-align: center; margin: 16px 0;">${katex.renderToString(tex, {
          throwOnError: false,
          displayMode: true
        })}</div>`;
      } catch (error) {
        console.error('渲染块级公式失败:', error);
        return `<div style="color: #999; font-style: italic; text-align: center; margin: 16px 0;">[公式: ${tex}]</div>`;
      }
    });
    
    // 处理图片错误
    processed = processed.replace(/<img([^>]*)>/gi, (match, attributes) => {
      // 清理属性中的问题字符
      const cleanAttributes = attributes
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
      
      return `<img${cleanAttributes} style="max-width:100%;height:auto;border-radius:8px;margin:8px 0;" onerror="this.style.display='none'">`;
    });
    
    return processed;
  } catch (error) {
    console.error('处理内容时出错:', error);
    return content;
  }
};

// 将JSON格式转换为HTML
const convertJsonToHtml = (jsonContent) => {
  try {
    const data = JSON.parse(jsonContent);
    let html = '';
    
    if (Array.isArray(data.children)) {
      data.children.forEach(child => {
        html += convertNodeToHtml(child);
      });
    } else if (data.children) {
      html += convertNodeToHtml(data);
    } else {
      html += `<p>${JSON.stringify(data, null, 2)}</p>`;
    }
    
    return html;
  } catch (error) {
    console.error('转换JSON到HTML失败:', error);
    return `<p>${jsonContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
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
      html = `<h1 style="font-size: 24px; font-weight: bold; color: #2e7d32; margin: 16px 0 8px 0;">${text}</h1>`;
      break;
    case 'header2':
      html = `<h2 style="font-size: 22px; font-weight: bold; color: #2e7d32; margin: 16px 0 8px 0;">${text}</h2>`;
      break;
    case 'header3':
      html = `<h3 style="font-size: 18px; font-weight: bold; color: #2e7d32; margin: 16px 0 8px 0;">${text}</h3>`;
      break;
    case 'header4':
      html = `<h4 style="font-size: 16px; font-weight: bold; color: #2e7d32; margin: 16px 0 8px 0;">${text}</h4>`;
      break;
    case 'header5':
      html = `<h5 style="font-size: 14px; font-weight: bold; color: #2e7d32; margin: 16px 0 8px 0;">${text}</h5>`;
      break;
    case 'header6':
      html = `<h6 style="font-size: 12px; font-weight: bold; color: #2e7d32; margin: 16px 0 8px 0;">${text}</h6>`;
      break;
    case 'list':
      html = `<ul style="margin: 10px 0 10px 20px; padding-left: 20px;">${node.children ? node.children.map(child => `<li style="margin: 5px 0; line-height: 1.7; color: #555;">${child.text || ''}</li>`).join('') : ''}</ul>`;
      break;
    case 'ordered-list':
      html = `<ol style="margin: 10px 0 10px 20px; padding-left: 20px;">${node.children ? node.children.map(child => `<li style="margin: 5px 0; line-height: 1.7; color: #555;">${child.text || ''}</li>`).join('') : ''}</ol>`;
      break;
    case 'blockquote':
      html = `<blockquote style="border-left: 4px solid #4CAF50; padding-left: 16px; margin: 16px 0; color: #666; font-style: italic; background: #f8faf8; border-radius: 0 8px 8px 0; padding: 16px;">${text}</blockquote>`;
      break;
    case 'code':
      html = `<pre style="background: #f1f8e9; border-radius: 8px; padding: 16px; font-family: \'Courier New\', monospace; font-size: 15px; white-space: pre-wrap; word-break: break-all; overflow-x: auto; margin: 8px 0; border-left: 4px solid #4CAF50;"><code>${text}</code></pre>`;
      break;
    case 'image':
      const src = node.src || '';
      html = `<img src="${src}" alt="${text}" style="max-width:100%;height:auto;border-radius:8px;margin:8px 0;" onerror="this.style.display='none'">`;
      break;
    default:
      html = `<p style="margin: 10px 0; line-height: 1.7; color: #555;">${text}</p>`;
  }
  
  return html;
};

// 监听content变化
watch(() => props.content, (newContent) => {
  if (newContent) {
    processedContent.value = processContent(newContent);
  } else {
    processedContent.value = '';
  }
}, { immediate: true });

// 处理点击事件
const handleTap = (event) => {
  // 可以在这里处理链接点击等事件
  
};
</script>

<style>
.simple-text-viewer {
  width: 100%;
  line-height: 1.7;
  font-size: 16px;
  color: #333;
}

/* 小程序中的rich-text样式 */
.simple-text-viewer rich-text {
  width: 100%;
}
</style> 