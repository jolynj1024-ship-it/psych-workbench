# 部署指南：让手机与电脑实时同步

本应用架构：**一个 Node 后端（server.js + db.json）+ 前端静态文件（public/）**。
要做到「改一处、所有设备秒同步」，必须让手机和电脑都连到**同一个云端后端**。
下面是从「本地项目」到「云端常驻服务」的完整步骤。

---

## 第 0 步：把项目推到 GitHub（云端主机都要从这里拉代码）

在你自己的电脑上（不是手机），打开终端，进入项目目录执行：

```bash
cd psych-workbench
git init
git add .
git commit -m "心理学工作者工作台 初始版本"
git branch -M main
git remote add origin https://github.com/<你的用户名>/psych-workbench.git
git push -u origin main
```

> 没有 GitHub 账号？去 https://github.com 免费注册一个，新建一个**空仓库** `psych-workbench`，然后把上面 `<你的用户名>` 换成你的用户名即可。

---

## 第 1 步：选一个云主机并部署

### 方案 A：Koyeb（推荐，真正免费 + 数据持久）
1. 打开 https://koyeb.com ，用 GitHub 登录（免费）。
2. 点 **Create App** → 选择你的 GitHub 仓库 `psych-workbench`。
3. 构建类型选 **Node.js**，启动命令填 `node server.js`。
4. 展开 **Advanced**，添加一个 **Volume（持久卷）**，挂载路径填 `/data`。
5. 设置环境变量 `DB_FILE = /data/db.json`（让数据库写到持久盘，重启不丢）。
6. 部署，完成后会得到一个 `https://xxxx.koyeb.app` 永久地址。

部署好后在**电脑和手机上都打开这个地址** → 数据自动共享、实时同步。

### 方案 B：Render（易用，但持久盘需付费套餐）
1. 打开 https://render.com ，注册并连接 GitHub。
2. **New > Web Service** → 选择仓库 → 选 **Use render.yaml**（项目里已配好）。
   - 或手动填：Build `npm install`，Start `node server.js`。
3. ⚠️ Render **免费套餐不含持久磁盘**，磁盘需付费套餐（约 $7/月）。
   若用免费套餐，数据库会随每次重启清空——只适合临时演示。要持久请升级套餐并在 render.yaml 的 disk 配置生效。
4. 部署后得到 `https://xxxx.onrender.com` 永久地址。

### 方案 C：Railway（持久文件系统，需绑定支付方式领 $5 试用额度）
1. 打开 https://railway.app ，用 GitHub 登录。
2. **New Project > Deploy from GitHub repo** 选本仓库。
3. 在 Variables 加 `DB_FILE = /data/db.json`，并添加 Volume 挂载 `/data`（Railway 文件系统本身在重启间也会保留，挂卷更稳妥）。
4. 生成永久域名，两端访问即可。

---

## 第 2 步：两端使用
- **电脑**：浏览器打开云端地址（如 `https://xxxx.koyeb.app`）。
- **手机（WorkBuddy）**：在 WorkBuddy 内置浏览器里打开同一个云端地址。
- 任一端录入 / 修改，另一端刷新即看到 → 真正的自动实时同步。

> 提示：云端地址无登录鉴权，请妥善保管链接，不要外泄。

---

## 备选：不想用云主机？自己电脑跑隧道（即时但需开机）
见下方「临时方案」。仅适合临时演示，电脑关机即失效。

---

## 临时方案：Cloudflare 隧道（0 配置，立刻能用，需电脑开机）
把**你电脑上正在跑的本地服务**临时暴露到公网，手机直接访问它（数据是电脑真实数据，实时同步）。
> 注意：本沙箱环境的网络封了 Cloudflare 隧道端口，无法从这里开启；请在**你自己电脑**的正常终端运行。

```bash
# 1. 下载 cloudflared（Windows）
curl -sSL -o cloudflared.exe https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
# 2. 确保工作台服务在跑（端口 3456）
# 3. 开隧道
./cloudflared.exe tunnel --url http://localhost:3456
```
终端会打印 `https://xxxx.trycloudflare.com`，手机打开即可。地址每次重启会变。
