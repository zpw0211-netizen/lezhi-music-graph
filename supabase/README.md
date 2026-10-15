# 芽谱账号服务

本次上线提供邮箱验证码注册、账号或邮箱登录、邮箱验证码找回密码，以及教师建班、学生申请、教师审核的班级绑定。每位教师对应一个班级，每位学生最多加入一个班级。手机号流程保留在关闭的功能开关之后。

## 已配置的生产服务

- Supabase 项目：`geqowfddhdokqskesjtb`；网站：`https://yapu.studio`。
- 邮箱确认必须开启；密码至少 8 位，并包含大写字母、小写字母和数字。
- 邮箱验证码为 6 位，600 秒有效，同一邮箱发送间隔至少 60 秒；项目邮件发送容量为每小时 100 封。
- 自定义 SMTP 使用 Resend；发件人 `芽谱 <no-reply@auth.yapu.studio>`。SMTP 密钥仅保存在 Supabase 后台。
- 注册和找回密码模板见 `templates/`，已保存到 Supabase 对应的邮件模板中。
- `yapu-login` Edge Function 允许正式网站来源，内部调用 Supabase 密码认证，登录前不要求用户 JWT，并执行独立限流。
- GitHub Pages 使用四个公开仓库变量：`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`、`NEXT_PUBLIC_ACCOUNTS_ENABLED=true`、`NEXT_PUBLIC_PHONE_AUTH_ENABLED=false`。

## 数据库来源与迁移记录

`migrations/202610090001_yapu_accounts.sql` 是这次首次建库的合并安装源，已通过 SQL Editor 执行。它不是可重复执行脚本，**不要再次应用到已有生产库，也不要直接对该库执行自动 db push**。

生产库还通过 Supabase MCP 应用了两项修复，合并安装源已同步其最终内容：

- `20261009095908_fix_yapu_login_limit_variable`：消除限流函数的变量与列名歧义。
- `20261009102909_optimize_yapu_membership_rls`：缓存策略中的调用者 ID，避免每行重复计算。

后续数据库改动应使用 Supabase CLI `migration new` 创建新文件，并在确认生产基线与迁移历史后应用。私有邀请码、限流和每日使用记录均不开放给客户端直接读写。六个客户端 RPC 仅允许已登录者调用，并在函数内部核对身份、验证状态和班级归属；这些有意使用 SECURITY DEFINER 的接口已做越权测试。

## 验证与运行限制

- `tests/account_permissions.sql`、`tests/login_rate_limit.sql` 在事务内运行并回滚测试数据。
- 邮件供应商测试地址的实际注册发送、6 位验证码确认、账号登录、找回密码发送、验证码确认、改密和全局退出均已验证；旧密码被拒绝，新密码可登录。
- 登录接口检查包括 CORS、HTTP 方法、坏 JSON、错误凭据和限流；未向未登录调用者暴露其他人的联系方式。
- 前端按上海日期记录每天一次的登录使用情况，省份统计数据位于私有表；不会阻塞用户登录。
- 当前 Resend 免费额度为每日 100 封、每月 3000 封，注册、重发和找回密码共同消耗此额度；未购买付费服务。
- Supabase Free 不包含泄露密码检查。本次使用服务端密码复杂度要求、邮件验证及接口限流。

上线后应使用本人实际邮箱再确认收件箱到达情况；密码与验证码由本人保管。
