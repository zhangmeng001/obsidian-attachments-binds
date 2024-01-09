# Obsidian attachment binds

一个笔记附件绑定插件，绑定附件后移动笔记进行重组时，引用的附件也会跟谁笔记移动，并自动更新笔记中对附件的引用链接。

**Note:** 目前与Local Images Plus插件有冲突，Local Images Plus插件会在本插件更新笔记附件引用链接时认为是在线资源，重新下载一遍，将附件更新为Local Images Plus的图片设置方式。待修复



20240109更新

已经能够解析ob格式的引用，标准markdown还识别有问题。


目前插件基本功能还不完善，不建议使用，待完善后再使用。

## todo

* [ ] 配置截面完善
* [ ] 配置信息的逻辑判断，包括是否开启插件，附件目录，过滤项等
* [ ] 多线程处理

代码说明

setting.ts——页面

main.ts——插件业务逻辑

```js
npm run build
```

执行上述命令会在插件文件夹的 **根目录** 生成插件的编译版本—— `main.js` 文件
