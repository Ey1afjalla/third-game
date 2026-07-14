# Claude 开发规范

## 项目目标

本项目为《迷你地下城指挥官》，目标是完成一款本地单机战术自动战斗 Roguelike 游戏。项目需要稳定可玩、主题统一、文档完整，并最终打包成安装包或可执行文件进行分发。

## 核心约束

- 所有 UI 和图片必须切合“地下城战术指挥”主题。
- 主界面尽量控制在一个电脑屏幕范围内展示。
- 复杂文本、战斗日志、系统说明、行为树详情和数值公式需要折叠或切换显示。
- 优先完成可玩的最小闭环，再扩展系统。
- 战斗逻辑、数值配置和 UI 表现需要尽量分离。
- 不将账号、密码、token 或其他敏感信息写入源码、文档或提交记录。

## 开发职责

Claude 需要尽量自主完成：

- 项目初始化。
- 核心战斗系统。
- 小队、敌人、技能、Buff / Debuff、装备和地下城路线。
- 展示模式、战斗日志、复盘和调参面板。
- UI 原型记录、素材规划和素材生成记录。
- 文档维护、测试记录、版本记录和最终发布准备。

## 必须维护的文档

- `RequirementsDoc.md`：需求文档。
- `docs/DevelopmentLog.md`：开发过程记录。
- `docs/ChangeLog.md`：版本变化记录。
- `docs/Architecture.md`：架构说明。
- `docs/CombatSystemDesign.md`：战斗系统设计。
- `docs/AIBehaviorDesign.md`：行为树和状态机设计。
- `docs/BalanceDesign.md`：数值和平衡设计。
- `docs/AssetPromptLog.md`：素材生成记录。
- `docs/DemoScript.md`：演示脚本。
- `docs/InterviewGuide.md`：项目亮点介绍。
- `docs/TaskBoard.md`：任务看板。
- `docs/QAReport.md`：测试和验收记录。
- `docs/ReleaseChecklist.md`：发布检查清单。

## 每轮开发要求

每轮开发后至少更新：

- `docs/DevelopmentLog.md`
- `docs/TaskBoard.md`

如果形成可运行版本，需要更新：

- `docs/ChangeLog.md`

如果进行测试或构建，需要更新：

- `docs/QAReport.md`

如果涉及素材，需要更新：

- `docs/AssetPromptLog.md`

如果涉及最终打包或发布，需要更新：

- `docs/ReleaseChecklist.md`

## GitHub 交付

远程仓库：

```text
https://github.com/Ey1afjalla/third-game.git
```

要求：

- 每个可用版本推送到 GitHub。
- 每个正式版本创建 Git tag。
- 最终版创建 GitHub Release。
- Release 上传安装包或可执行文件。
- 最终分发物需要排除开发依赖，并完整包含运行时依赖。

## 需要人工确认的事项

以下操作需要用户确认：

- 使用 Image-2 账号登录生成素材。
- 推送到 GitHub 远程仓库。
- 创建 Git tag。
- 创建 GitHub Release。
- 上传最终安装包或可执行文件。

## 开发优先级

1. 可玩 MVP。
2. 战斗系统完整化。
3. Roguelike 构筑。
4. 展示模式和调参面板。
5. 统一主题美术。
6. 文档完善。
7. 本地打包和最终发布。
