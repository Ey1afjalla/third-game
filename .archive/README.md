# 📁 文档归档索引

## 目录结构

```
.archive/
├── stage-reports/        # 阶段开发报告
├── session-logs/         # 开发会话日志
├── release-docs/         # 版本发布文档
└── debug-reports/        # 问题调试报告
```

---

## 📊 阶段开发报告 (.archive/stage-reports/)

### 阶段2
- `Stage2-Completion-Report.md` - 阶段2完成报告
  - 内容：战斗系统完整化完成总结
  - 版本：v0.2.0

### 阶段3
- `Stage3-Checklist.md` - 阶段3检查清单
  - 内容：功能完成检查清单
  
- `Stage3-Complete-Report.md` - 阶段3完成报告（100%）
  - 内容：最终完成度报告
  
- `Stage3-Completion-Report.md` - 阶段3完成总结
  - 内容：开发成果和验收标准
  
- `Stage3-Final-Summary.md` - 阶段3最终总结
  - 内容：完整的开发总结
  
- `Stage3-Ready-To-Release.md` - 阶段3发布准备
  - 内容：准备发布v0.3.0的清单

---

## 📝 开发会话日志 (.archive/session-logs/)

- `Session-Summary-Stage2.md` - 阶段2会话总结
  - 内容：阶段2开发过程记录
  
- `Session-Summary-Stage3.md` - 阶段3会话总结
  - 内容：阶段3开发过程记录
  
- `Session-Final-Stage3.md` - 阶段3最终会话
  - 内容：阶段3最后的开发会话记录

---

## 🚀 版本发布文档 (.archive/release-docs/)

- `Release-v0.3.0.md` - v0.3.0发布说明
  - 版本：v0.3.0
  - 内容：Roguelike构筑系统完成
  - 发布日期：2026-07-15

---

## 🐛 问题调试报告 (.archive/debug-reports/)

- `Debug-Node-Click-Issue.md` - 节点点击问题调试
  - 问题：节点点击无响应
  - 原因：状态检查逻辑错误
  - 解决：支持current和available状态

---

## 📌 根目录保留文档

以下文档保留在项目根目录：

### 主要总结文档
- `PROJECT_SUMMARY.md` - 项目整体总结
- `FINAL_PROJECT_SUMMARY.md` - 项目最终总结
- `README.md` - 项目说明

### 需求和设计文档（docs/目录）
- `RequirementsDoc.md`
- `Architecture.md`
- `CombatSystemDesign.md`
- 等等...

### 管理文档（docs/目录）
- `TaskBoard.md`
- `DevelopmentLog.md`
- `ChangeLog.md`
- 等等...

---

## 🔍 如何使用归档文档

### 按类型查找
1. **阶段报告** → `.archive/stage-reports/`
2. **开发日志** → `.archive/session-logs/`
3. **发布说明** → `.archive/release-docs/`
4. **问题调试** → `.archive/debug-reports/`

### 文件命名规范
- 所有文件名使用 `Kebab-Case` (连字符分隔)
- 格式：`类型-名称-描述.md`
- 例如：`Stage3-Complete-Report.md`

### 快速查找命令
```bash
# 查找所有阶段报告
ls .archive/stage-reports/

# 查找特定阶段文档
ls .archive/stage-reports/ | grep Stage3

# 查找发布文档
ls .archive/release-docs/

# 搜索文档内容
grep -r "关键词" .archive/
```

---

## 📅 归档日期

- 归档时间：2026-07-15
- 归档范围：阶段2和阶段3的开发文档
- 归档文件数：13个

---

**说明**：此索引文件位于 `.archive/README.md`，用于快速查找归档文档。
