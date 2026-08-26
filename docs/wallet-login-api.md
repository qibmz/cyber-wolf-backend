# Web3 钱包登录 (SIWE) — 接口 Mock 说明

> 前端对接参考文档。后端已实现（`src/auth-wallet/*`），本文件给出每个接口的**请求参数、成功与失败返回**，方便前端先行联调。

## 通用约定

- 全局前缀：`/api`，版本号：URI 方式。所有钱包接口都以 **`/api/v1/auth/wallet/...`** 开头。
- **成功响应**统一被 `ResponseInterceptor` 包裹为：

  ```json
  { "code": 200, "msg": "success", "data": { ... } }
  ```

- **失败响应**统一被异常过滤器包裹为：

  ```json
  {
    "code": 422,
    "msg": "<第一条错误的译文>",
    "errors": { "字段": "错误key或译文" }
  }
  ```

- 登录/绑定接口传 `user` 时，结构与现有的 `POST /api/v1/auth/email/login` 返回一致（`id`、`email`、`nickname`、`provider`、`socialId`、`photo`、`role`、`status`、`createdAt`、`updatedAt`、`deletedAt`，以及新增 `walletAddress`）；`password` 永不下发。
- 需要在请求头带登录态的接口，传 `Authorization: Bearer <accessToken>`（即登录返回的 `token`）。

## 相关环境变量（已有默认值）

| 变量 | 说明 | 默认 |
|---|---|---|
| `WALLET_DOMAIN` | 校验 SIWE 消息的 `domain`，需与前端签名页面的 `window.location.host` 一致（仅主机[:端口]，无 scheme），防跨站重放 | 空=不校验；示例 `localhost:3000` |
| `WALLET_NONCE_TTL` | 签名随机数有效期（毫秒） | `300000`（5 分钟） |

---

## 1. GET /api/v1/auth/wallet/nonce

获取服务端一次性签名随机数，前端用它构造 SIWE 消息并签名。

**无请求体 / 无需登录。**

```json
{
  "code": 200,
  "msg": "success",
  "data": { "nonce": "L1mN8wDIIzrURhLWx" }
}
```

---

## 2. POST /api/v1/auth/wallet/login

钱包登录。**首次用某地址登录会自动建号**（`email`、`password` 为空，`provider='wallet'`，`status=active`）；再次登录则直接进入该账号。若该地址此前已绑定到某个邮箱账号，则登录到该账号（双登录）。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `address` | string | ✅ | 钱包地址（`0x...`，wagmi 取） |
| `message` | string | ✅ | EIP-4361 / SIWE 完整消息文本 |
| `signature` | string | ✅ | 钱包签名（`0x...`，`signMessageAsync` 结果） |
| `nonce` | string | ✅ | 来自 `/nonce` 的随机数，且需写入 `message` 的 nonce 字段 |

```json
{
  "address": "0x3341Bb2ACcCd1ceB9335A474d5FB615397ae8C27",
  "message": "localhost:3000 wants you to sign in with your Ethereum account:\n0x3341Bb2ACcCd1ceB9335A474d5FB615397ae8C27\n\nSign in to Cyber Wolf\n\nURI: http://localhost:3000\nVersion: 1\nChain ID: 1\nNonce: L1mN8wDIIzrURhLWx\nIssued At: 2026-08-26T02:39:48.067Z",
  "signature": "0x...",
  "nonce": "L1mN8wDIIzrURhLWx"
}
```

**成功返回：**

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "token": "<accessToken>",
    "refreshToken": "<refreshToken>",
    "tokenExpires": 1710000000000,
    "user": { "id": 1, "email": null, "nickname": null, "provider": "wallet", "socialId": null, "walletAddress": "0x3341bb2acccd1ceb9335a474d5fb615397ae8c27", "photo": null, "role": { "id": 2 }, "status": { "id": 1 }, "createdAt": "...", "updatedAt": "...", "deletedAt": null }
  }
}
```

> `walletAddress` 统一存小写。前端用 `token` 作为 `Authorization: Bearer`；`refreshToken` 用于 `POST /api/v1/auth/refresh`。

**失败：**

```json
// nonce 过期/无效
{ "code": 422, "msg": "签名随机数已过期或无效，请重试", "errors": { "nonce": "nonceExpired" } }
// 签名无法通过校验（错误签名 / 地址不匹配 / domain 不匹配 / 非 SIWE 消息）
{ "code": 422, "msg": "钱包签名无效", "errors": { "message": "invalidSignature" } }
```

> 说明：失败响应的 `errors` 里是原始的消息 key（如 `nonceExpired`、`invalidSignature`），`msg` 才是当前语言的译文；请求头 `x-custom-lang` 可切换语言。

---

## 3. POST /api/v1/auth/wallet/bind

把钱包绑定到**当前登录的账号**（例如：邮箱注册的账号想支持钱包登录）。**需要登录**，请求头 `Authorization: Bearer <accessToken>`。

**请求体** 与 `login` 相同（`address` 为要绑定的钱包地址，签名证明拥有该钱包）。

```json
{
  "address": "0x...",
  "message": "<EIP-4361 消息>",
  "signature": "0x...",
  "nonce": "<来自 /nonce>"
}
```

**成功返回：** 绑定后的用户对象（同样包在 `data` 里）。

```json
{
  "code": 200,
  "msg": "success",
  "data": { "id": 1, "email": "john@example.com", "walletAddress": "0x...", "provider": "email", "role": { "id": 2 }, "status": { "id": 1 } }
}
```

**失败：**

```json
// 该钱包已绑定到其他账号
{ "code": 422, "msg": "该钱包已绑定到其他账号", "errors": { "walletAddress": "walletAlreadyBound" } }
```

---

## 4. POST /api/v1/auth/wallet/bind/email

给**钱包自动建号**的账号补绑邮箱 + 密码，使其之后也能用邮箱+密码登录（双登录的另一个方向）。**需要登录**。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `email` | string | ✅ | 要绑定的邮箱（唯一） |
| `password` | string | 否 | 若提供则设置登录密码（≥6 位） |

```json
{ "email": "john@example.com", "password": "secret123" }
```

**成功返回：** 更新后的用户。

```json
{
  "code": 200,
  "msg": "success",
  "data": { "id": 2, "email": "john@example.com", "walletAddress": "0x...", "provider": "wallet", "role": { "id": 2 }, "status": { "id": 1 } }
}
```

**失败：**

```json
// 邮箱已被其他账号占用（若属于本人账号则视为同邮箱，允许）
{ "code": 422, "msg": "邮箱已存在", "errors": { "email": "emailAlreadyExists" } }
```

---

## message 模板与校验要求（后端实际强校验的内容）

后端**不定义自定义字段结构**，`message` 必须是一个**合法的 EIP-4361 / SIWE 字符串**，由后端用 `siwe` 包的解析器校验。不是合法 SIWE 的消息会直接被 `new SiweMessage(...)` 解析失败，返回 `invalidSignature`。

标准的 SIWE（EIP-4361）消息文本格式如下（字段必须按此顺序，行尾无需额外空格）：

```
{domain} wants you to sign in with your Ethereum account:
{address}

{statement}

URI: {uri}
Version: {version}
Chain ID: {chainId}
Nonce: {nonce}
Issued At: {issuedAt}
{可选} Expiration Time: {expirationTime}
{可选} Not Before: {notBefore}
{可选} Request ID: {requestId}
{可选} Resources: {resources}
```

### 后端**必须存在**的字段（缺失会 `parse` 失败 → `invalidSignature`）

| 字段 | 说明 |
|---|---|
| `address` | 钱包地址，必须是合法以太坊地址 |
| `uri` | 请求方 origin，必须是合法 URI |
| `version` | SIWE 版本，写 `"1"` |
| `chainId` | 链 ID，必须是整数 |
| `nonce` | 必须等于 `/nonce` 下发、且在 TTL 内的一次性值 |

> 说明：`issuedAt` 后端默认可容忍缺失（但**强烈建议带上**，ISO8601 格式，如 `2026-08-26T02:39:48.067Z`）。`statement` 为任意文本，可省略。

### 后端**额外强制**的约束
- **`nonce`**：`message.nonce` 必须等于服务端 `/nonce` 下发值（后端总是用该值校验；不匹配 → `invalidSignature`，且一次性，用后即失效）。
- **`domain`**：若环境变量 `WALLET_DOMAIN` 已配置，`message.domain` 必须与其完全一致；不配置则不校验。`.env` 已示例配置为 `localhost:3000`（host[:port]，无 scheme），**需重启实例后生效**——生产务必设为前端实际域名。
- **`address`**：签名恢复出的地址必须等于 `message.address`，且等于请求体里的 `address`（后端统一小写比对）。
- **`expirationTime`**：若设置，必须是**未来**时间，否则返回 `Expired message` / `invalidSignature`。不设则不做失效校验。

### 后端**不校验**的（避免前端误解）
- **`chainId`**：后端目前不比对任何白名单，任意链 ID 均可（能否登录只看签名与 nonce/domain）。
- **`statement` / `uri` 内容**：只要格式合法即可，内容不校验。

---

## 前端 SIWE 消息构造示例（reown + wagmi）

```ts
import { SiweMessage } from 'siwe';

const nonceRes = await fetch('/api/v1/auth/wallet/nonce').then(r => r.json());
const nonce = nonceRes.data.nonce;

const message = new SiweMessage({
  domain: window.location.host,        // 须与后端 WALLET_DOMAIN 匹配
  address,                              // wagmi 取
  chainId,                              // wagmi 取
  uri: window.location.origin,
  version: '1',
  nonce,
  statement: 'Sign in to Cyber Wolf',
  issuedAt: new Date().toISOString(),
});

const messageStr = message.prepareMessage();
const signature = await signMessageAsync({ message: messageStr }); // wagmi

await fetch('/api/v1/auth/wallet/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-custom-lang': 'zh' },
  body: JSON.stringify({ address, message: messageStr, signature, nonce }),
}).then(r => r.json());
```

## 需要特别注意

- `message` 里的 `nonce` 必须等于 `/nonce` 返回的 `nonce`，否则 `siwe.verify` 失败（返回 `invalidSignature`），且一次性、用后即失效。
- `message` 里的 `domain` 在**配置了 `WALLET_DOMAIN` 时**必须与其一致，否则校验失败；未配置该变量则跳过 domain 校验（生产建议配置）。
- `address` 请输入 checksum 形式即可，后端会统一小写校验与存储。
- 钱包自动建号的账号 `email` 为 `null`，调用 `/auth/wallet/bind/email` 补邮箱后即可开启邮箱+密码登录。
