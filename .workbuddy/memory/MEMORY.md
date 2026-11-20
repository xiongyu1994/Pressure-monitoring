# 项目长期记忆（Pressure-monitoring）

## 后端代码规范（用户明确要求，2026-11-20）
- 后端（B 端 + C 端服务端代码）**只在源码项目** `C:\Users\24938\WorkBuddy\2026-11-13-14-29-06\admin-system\api` 里修改；C 端代码（capi.php 等）与 B 端同等对待，都放源码项目。
- `D:\phpstudy_pro\WWW\inspection-api` 只是**部署副本**（phpstudy 运行目录）。源码改完后需同步到部署目录才生效（PHP 无 opcache，覆盖文件即生效）。当前两边 capi.php 已一致。
- 部署目录有两处旧残留（未被引用，不影响运行）：根下旧版 `fee.php`（源码 `controllers/fee.php` 为新版，含 signImg/signTime 等字段）；`controllers/index.php`（旧入口残留，真实入口是根 `index.php`）。

## 系统架构速查
- 本项目：Vue3+Vite+Electron 压力监控客户端（C 端设备操作员）；后端 PHP+phpstudy（MySQL inspection 库）。
- 登录走 `POST /c/login`（c_user 表，checker01/123456），token 7 天；任务列表 `GET /c/task/list`（workorder 表）。
- 前端配置 `.env.local` 的 `VITE_API_BASE=http://localhost/inspection-api`（已 gitignore）。
- 模拟压力：server.js 顶部 `SIMULATE_PRESSURE=true`（正弦波 0→1→0，周期 SIM_PERIOD=100s）；传感器接好后改 false。
- 曲线抓取：整定压力模式按峰值触发（确认回落即抓），每单号 3 条；峰值居中铺满 0~100；抓取纯后台进行不打断实时曲线；重新校验弹窗可勾删某次记录并自动补抓。
- Y 轴量程：操作设置未勾自动量程→手动档位固定（量程2→4MPa）；勾自动量程→按任务 pressClassRangeMax 选最小覆盖档（0.50~0.70→量程1/1.6）；操作设置弹窗单选联动显示生效档位。
