<template>
  <div class="math-viewer" v-html="processedContent"></div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
});

const processedContent = ref('');

// 处理数学公式标记
const processMathFormulas = (html) => {
  if (!html) return html;
  
  console.log('MathViewer - 处理前的HTML:', html);
  
  let processedHtml = html;
  
  // 处理行内公式 $...$
  processedHtml = processedHtml.replace(/\$([^$\n]+?)\$/g, (match, tex) => {
    console.log('MathViewer - 处理行内公式:', tex);
    return `<span class="math-inline" data-tex="${tex.replace(/"/g, '&quot;')}">${tex}</span>`;
  });
  
  // 处理块级公式 $$...$$
  processedHtml = processedHtml.replace(/\$\$([^$\n]+?)\$\$/g, (match, tex) => {
    console.log('MathViewer - 处理块级公式:', tex);
    return `<div class="math-block" data-tex="${tex.replace(/"/g, '&quot;')}">${tex}</div>`;
  });
  
  console.log('MathViewer - 处理后的HTML:', processedHtml);
  return processedHtml;
};

// 渲染数学公式
const renderMathFormulas = () => {
  nextTick(() => {
    const container = document.querySelector('.math-viewer');
    if (!container) return;
    
    // 处理图片错误
    handleImageErrors(container);
    
    // 渲染行内公式 $...$
    const inlineMathElements = container.querySelectorAll('.math-inline');
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
        console.error('MathViewer - 渲染行内公式失败:', error);
        element.textContent = element.getAttribute('data-tex') || '';
      }
    });
    
    // 渲染块级公式 $$...$$
    const blockMathElements = container.querySelectorAll('.math-block');
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
        console.error('MathViewer - 渲染块级公式失败:', error);
        element.textContent = element.getAttribute('data-tex') || '';
      }
    });
  });
};

// 处理图片错误
const handleImageErrors = (container) => {
  try {
    const images = container.querySelectorAll('img');
    images.forEach(img => {
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
        
        // 设置默认样式（如果还没有设置）
        if (!img.style.maxWidth) {
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          img.style.borderRadius = '8px';
          img.style.margin = '8px 0';
        }
        
        // 标记为已处理
        img.setAttribute('data-error-handled', 'true');
      }
    });
  } catch (error) {
    console.error('MathViewer - 处理图片错误时出错:', error);
  }
};

// 监听content变化
watch(() => props.content, (newContent) => {
  if (newContent) {
    // 检查是否是JSON格式的内容
    if (newContent.trim().startsWith('{') || newContent.trim().startsWith('[')) {
      console.warn('MathViewer: 检测到JSON格式内容，转换为HTML格式');
      const processedContent = convertJsonToHtml(newContent);
      processedContent.value = processedContent;
    } else {
      const processed = processMathFormulas(newContent);
      processedContent.value = processed;
    }
    // 延迟渲染数学公式，确保DOM已更新
    setTimeout(renderMathFormulas, 100);
  } else {
    processedContent.value = '';
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
    console.error('MathViewer: 转换JSON到HTML失败:', error);
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
      html = `<img src="${src}" alt="${text}" onerror="this.style.display='none'" style="max-width:100%;height:auto;border-radius:8px;margin:8px 0;">`;
      break;
    default:
      html = `<p>${text}</p>`;
  }
  
  return html;
};
</script>

<style>
.math-viewer {
  width: 100%;
  line-height: 1.7;
  font-size: 16px;
  color: #333;
}

.math-viewer h1, .math-viewer h2, .math-viewer h3, .math-viewer h4, .math-viewer h5, .math-viewer h6 {
  margin: 16px 0 8px 0;
  font-weight: bold;
  color: #2e7d32;
}

.math-viewer h1 { font-size: 24px; }
.math-viewer h2 { font-size: 22px; }
.math-viewer h3 { font-size: 18px; }
.math-viewer h4 { font-size: 16px; }
.math-viewer h5 { font-size: 14px; }
.math-viewer h6 { font-size: 12px; }

.math-viewer p {
  margin: 10px 0;
  line-height: 1.7;
  color: #555;
}

/* 数学公式样式 */
.math-inline {
  display: inline-block;
  margin: 0 2px;
  padding: 2px 4px;
  background: #f8faf8;
  border-radius: 4px;
  border: 1px solid #e8f5e8;
  font-size: 14px;
}

.math-block {
  display: block;
  margin: 16px 0;
  padding: 16px;
  background: #f8faf8;
  border-radius: 8px;
  border: 2px solid #e8f5e8;
  text-align: center;
  overflow-x: auto;
  box-shadow: 0 2rpx 8rpx rgba(76, 175, 80, 0.1);
}

/* KaTeX 样式覆盖 */
.katex {
  font-size: 1em;
  color: #2e7d32;
}

.katex-display {
  margin: 0;
  padding: 0;
}

.katex-html {
  font-size: 1em;
}

/* 数学公式容器样式 */
.math-inline .katex {
  font-size: 0.9em;
}

.math-block .katex {
  font-size: 1.1em;
}
</style> 