/**
 * @fileoverview highlight 插件
 * Include prismjs (https://prismjs.com)
 */
import './prism.min'

// 兼容性处理：确保Prism对象存在
let prism;
try {
  // 尝试从全局获取Prism
  if (typeof window !== 'undefined' && window.Prism) {
    prism = window.Prism;
  } else if (typeof global !== 'undefined' && global.Prism) {
    prism = global.Prism;
  } else {
    // 如果都不存在，创建一个空的Prism对象
    prism = {
      languages: {},
      highlight: function(text, grammar, language) {
        return text;
      }
    };
    console.warn('Prism对象未找到，使用默认实现');
  }
} catch (error) {
  console.warn('获取Prism对象失败:', error);
  // 创建默认的Prism对象
  prism = {
    languages: {},
    highlight: function(text, grammar, language) {
      return text;
    }
  };
}
import config from './config'
import Parser from '../parser'

function Highlight (vm) {
  this.vm = vm
}

Highlight.prototype.onParse = function (node, vm) {
  if (node.name === 'pre') {
    if (vm.options.editable) {
      node.attrs.class = (node.attrs.class || '') + ' hl-pre'
      return
    }
    let i
    for (i = node.children.length; i--;) {
      if (node.children[i].name === 'code') break
    }
    if (i === -1) return
    const code = node.children[i]
    let className = code.attrs.class + ' ' + node.attrs.class
    i = className.indexOf('language-')
    if (i === -1) {
      i = className.indexOf('lang-')
      if (i === -1) {
        className = 'language-text'
        i = 9
      } else {
        i += 5
      }
    } else {
      i += 9
    }
    let j
    for (j = i; j < className.length; j++) {
      if (className[j] === ' ') break
    }
    const lang = className.substring(i, j)
    if (code.children.length) {
      const text = this.vm.getText(code.children).replace(/&amp;/g, '&')
      if (!text) return
      if (node.c) {
        node.c = undefined
      }
      if (prism.languages[lang]) {
        code.children = (new Parser(this.vm).parse(
          // 加一层 pre 保留空白符
          '<pre>' + prism.highlight(text, prism.languages[lang], lang).replace(/token /g, 'hl-') + '</pre>'))[0].children
      }
      node.attrs.class = 'hl-pre'
      code.attrs.class = 'hl-code'
      if (config.showLanguageName) {
        node.children.push({
          name: 'div',
          attrs: {
            class: 'hl-language',
            style: 'user-select:none'
          },
          children: [{
            type: 'text',
            text: lang
          }]
        })
      }
      if (config.copyByLongPress) {
        node.attrs.style += (node.attrs.style || '') + ';user-select:none'
        node.attrs['data-content'] = text
        vm.expose()
      }
      if (config.showLineNumber) {
        const line = text.split('\n').length; const children = []
        for (let k = line; k--;) {
          children.push({
            name: 'span',
            attrs: {
              class: 'span'
            }
          })
        }
        node.children.push({
          name: 'span',
          attrs: {
            class: 'line-numbers-rows'
          },
          children
        })
      }
    }
  }
}

export default Highlight
