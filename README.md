# OttoMob SMM Marketplace

第一阶段只实现静态首页，用于确认整体设计和交互。登录、充值、下单、订单查询、状态同步、后台管理会在后续阶段逐步接入。

## 本地启动

```bash
npm install
npm run dev
```

访问 `http://localhost:3000`。

## 生产构建

```bash
npm install
npm run build
npm run start
```

默认监听 `3000` 端口。

## 宝塔 + Nginx 部署建议

1. 在宝塔创建 Node 项目或使用 PM2 管理项目。
2. 上传代码到站点目录，例如 `/www/wwwroot/ottomob`。
3. 在项目目录执行 `npm install && npm run build`。
4. 使用 PM2 启动：`pm2 start npm --name ottomob -- run start`。
5. 在宝塔网站配置中开启 Nginx 反向代理到 `http://127.0.0.1:3000`。

## Nginx 反向代理示例

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 环境变量

复制 `.env.example` 为 `.env.local`，按实际 MySQL 和 API 信息填写。第一阶段不会真实调用 AmazingSMM API。

## 第二阶段功能

已加入邮箱注册登录、Google OAuth 登录预留、用户中心、MySQL 表结构、服务目录 API、AmazingSMM 服务同步筛选逻辑。

## 第三阶段功能

已加入服务详情页、本地 pending 订单、用户中心订单列表和充值页面占位。

当前下单流程：

1. 前台服务目录读取数据库服务。
2. 点击服务进入 `/services/[id]`。
3. 用户输入社媒链接和数量。
4. 系统按 `rate * quantity / 1000` 计算预估金额。
5. 提交后创建本地订单，状态为 `pending`。

第三阶段暂不扣余额、不接真实支付、不提交 AmazingSMM。真实支付和供应商下单会在后续阶段接入。

## 第四阶段功能

已接入 Stripe Checkout 作为唯一充值方式，并完善余额消费订单流程。

当前资金和订单流程：

1. 用户在 `/funds` 选择充值金额。
2. 服务端创建 Stripe Checkout Session。
3. Stripe 支付成功后调用 webhook：`/api/payments/stripe/webhook`。
4. Webhook 将充值记录标记为 `paid`，并增加用户余额。
5. 用户创建订单时，系统检查余额。
6. 余额足够则扣款、写入余额流水，并创建 `pending / paid` 本地订单。
7. AmazingSMM 真实下单仍保留到下一阶段。

### Stripe 环境变量

```env
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_or_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_CURRENCY=usd
```

Stripe Dashboard Webhook endpoint:

```text
https://ottomob.com/api/payments/stripe/webhook
```

建议监听事件：

```text
checkout.session.completed
checkout.session.expired
```

### 线上数据库迁移

已上线旧版本时，需要执行第四阶段迁移：

```bash
cd /www/wwwroot/ottomob.com
mysql -u 数据库用户 -p 数据库名 < database/migrations/2026-06-04-stripe-wallet.sql
```

迁移会新增：

- `orders.payment_status`
- `recharges`
- `wallet_transactions`

## 第五阶段功能

已接入 AmazingSMM 真实下单。

当前真实订单流程：

1. 用户在服务详情页输入链接和数量。
2. 系统按服务价格计算订单金额。
3. 检查用户余额。
4. 余额足够则扣款并创建本地订单。
5. 系统调用 AmazingSMM `add` 接口创建供应商订单。
6. 成功后保存 `external_order_id`，本地订单状态更新为 `processing / paid`。
7. 如果供应商接口失败或未配置 API key，系统自动退款到用户余额，并将订单标记为 `failed / refunded`。

上线前必须配置：

```env
AMAZINGSMM_API_URL=https://amazingsmm.com/api/v2
AMAZINGSMM_API_KEY=your_real_api_key
```

第五阶段暂未做订单状态同步。后续会调用 AmazingSMM `status` 接口，将本地订单更新为 completed、partial、canceled 等状态。

### MySQL 初始化

在宝塔 MySQL 中创建数据库和用户后，导入：

```bash
mysql -u ottomob_user -p ottomob < database/schema.sql
```

### Google OAuth 配置

在 Google Cloud Console 创建 OAuth Client，类型选择 Web application。

回调地址填写：

```text
https://你的域名/api/auth/google/callback
```

本地开发可填写：

```text
http://localhost:3000/api/auth/google/callback
```

然后在 `.env.local` 中配置：

```env
GOOGLE_CLIENT_ID=你的 Client ID
GOOGLE_CLIENT_SECRET=你的 Client Secret
GOOGLE_REDIRECT_URI=https://你的域名/api/auth/google/callback
```

### 服务目录同步

AmazingSMM API 文档说明服务列表使用 `POST https://amazingsmm.com/api/v2`，参数为 `key` 和 `action=services`。

同步入口：

```bash
curl -X POST https://你的域名/api/services/sync \
  -H "x-sync-secret: 你的 SERVICE_SYNC_SECRET"
```

同步规则：

- 只识别 Instagram、TikTok、YouTube、Facebook、Telegram、Twitter/X
- 每个平台的每个品类只保留 rate 最低的一个服务
- Followers/Members/Subscribers 最低购买量为 500，步进 500
- Views/Impressions 最低购买量为 500，步进 500
- Likes 最低购买量为 100，步进 100
- Comments 最低购买量为 10，步进 10
- 服务最大购买量小于最低购买量时会跳过

同步后的前台目录接口：

```text
GET /api/services
GET /api/services?platform=Instagram
```
