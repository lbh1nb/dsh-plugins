# dsh-plugins

DeepSeek Harness（DSH）实用插件合集 —— 为本地 AI 助手运行时补齐高频能力。

## 插件一览

| 插件 | 功能 | 挂载点 |
|---|---|---|
| [dsh-session-archive](./packages/dsh-session-archive) | 会话归档管理：查看归档/全部会话，两步确认永久删除 | 设置页（Settings section） |
| [dsh-attachment-upload](./packages/dsh-attachment-upload) | 输入框「📎 附件」：上传文件到工作区 `.dsh-attachments\`，路径自动插入草稿 | 输入框工具行左侧 |
| [dsh-steer-button](./packages/dsh-steer-button) | 输入框「插话」按钮：一键把草稿注入运行中的轮次（steer），中途纠偏不用快捷键 | 输入框工具行右侧 |

三个插件均已在生产环境长期运行，并经过真实链路端到端冒烟验证（页面探针 + 功能断言）。

## 安装

前置：已部署 DeepSeek Harness Web，官方运行时包为 [`@deepseek-ai/dsh-client-runtime`](https://www.npmjs.com/package/@deepseek-ai/dsh-client-runtime) 等。

1. 克隆本仓库到本地任意位置：

   ```bash
   git clone https://github.com/lbh1nb/dsh-plugins.git
   ```

2. 编辑 web profile（Windows 为 `C:\Users\<用户名>\.dsh\profiles\web\package.json`），把想用的插件加进 `dsh.profile.bundles` 与 `dependencies`（`link:` 指向仓库内子包绝对路径，路径用正斜杠）：

   ```json
   {
     "dsh": { "profile": { "bundles": ["dsh-session-archive", "dsh-attachment-upload", "dsh-steer-button"] } },
     "dependencies": {
       "dsh-session-archive": "link:C:/path/to/dsh-plugins/packages/dsh-session-archive",
       "dsh-attachment-upload": "link:C:/path/to/dsh-plugins/packages/dsh-attachment-upload",
       "dsh-steer-button": "link:C:/path/to/dsh-plugins/packages/dsh-steer-button"
     }
   }
   ```

3. 在 profile 目录安装并重启 DSH Web：

   ```bash
   npx -y pnpm@11.21.0 install
   ```

4. 重启后插件常驻生效（客户端 bundle 在启动时构建）。

## 致谢

- `dsh-steer-button` 的按钮图标由 Trae（AI IDE）生成，经透明抠图与像素级小尺寸验收。
- 感谢 [DeepSeek Harness](https://www.npmjs.com/package/@deepseek-ai/dsh-client-runtime) 的 Cordis 插件体系。

## License

MIT © [lbh1nb](https://github.com/lbh1nb)
