import { marked } from 'marked';

export default defineNuxtPlugin(() => {
  marked.setOptions({
    breaks: true,        // 转换回车为 <br>
    gfm: true,           // 启用GitHub风格的Markdown
    headerIds: true,     // 为标题增加id
    mangle: false,       // 不转义标题中的内容
    sanitize: false,     // 不对输出进行sanitize
    smartLists: true,    // 使用更智能的列表行为
    smartypants: false,  // 不使用更漂亮的标点符号
    xhtml: false         // 不使用XHTML的自闭合标签
  });
});
