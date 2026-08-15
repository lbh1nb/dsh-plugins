# dsh-attachment-upload

DeepSeek Harness Web 插件：输入框附件上传。

- 输入框工具行左侧「📎 附件」按钮（`conversation.input.left`）。
- 文件上传到**当前工作区**的 `.dsh-attachments\`（同源 POST `/_dsh/attachment-upload/upload`，`x-file-name` / `x-cwd` 头）。
- 单文件 64MB，文件名消毒 + 同名去重；上传后把「📎 附件: <绝对路径>」插入草稿，供 agent 用文件工具读取。

安装方法见仓库根 [README](../../README.md)。

## License

MIT
