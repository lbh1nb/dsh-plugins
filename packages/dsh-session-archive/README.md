# dsh-session-archive

DeepSeek Harness Web 插件：会话归档管理。

- 设置页新增「会话归档」区块：查看已归档会话与全部会话。
- 两步确认永久删除死会话（宿主同源路由 `/_dsh/session-archive/delete`，仅"正在运行"的会话锁定不可删）。
- 一键取消归档：已归档会话卡片右下角「取消归档」按钮（宿主同源路由 `/_dsh/session-archive/unarchive`），会话立即恢复出现在侧栏，不删除任何日志。
- 归档会话在侧栏消失后仍可在本页找回。

安装方法见仓库根 [README](../../README.md)。

## License

MIT
