# NetKit Web — 极客网络 · 硬件 · 系统在线工具台

<p align="left">
  <a href="https://xiaoA0v0.github.io/NetKit-Web/" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-%E7%82%B9%E5%87%BB%E5%9C%A8%E7%BA%BF%E4%BD%BF%E7%94%A8-0ea5e9?style=for-the-badge&logo=githubpages&logoColor=white" alt="Live Demo" />
  </a>
  <img src="https://img.shields.io/badge/Stack-HTML5%20%2B%20CSS3%20%2B%20Vanilla%20JS-38bdf8?style=for-the-badge" alt="Tech Stack" />
  <img src="https://img.shields.io/badge/Dependencies-Zero-34d399?style=for-the-badge" alt="Zero Dependencies" />
  <img src="https://img.shields.io/badge/License-MIT-6366f1?style=for-the-badge" alt="License" />
</p>

一款**纯前端、零依赖、开箱即用**的极客网络、硬件与系统实用在线工具台。所有运算均在浏览器本地完成，不上传任何数据，支持直接部署在 GitHub Pages 或双击 `index.html` 离线使用。

🌐 **在线访问地址**：https://xiaoA0v0.github.io/NetKit-Web/

---

## ✨ 五大核心功能模块

1. **🌐 IPv4 / CIDR 子网可视化计算与拆分器**
   - 支持直接粘贴 `192.168.1.10/24` 或滑动调整掩码前缀。
   - 实时计算 CIDR 网段、子网掩码、反掩码（Wildcard）、网络地址、广播地址、可用主机范围、可用主机数及私网/公网/CGNAT 归属类型。
   - 提供 **32 位二进制网络位 / 主机位彩色位图**，并支持一键将网段等分为 `2 / 4 / 8 / 16` 个子网，支持 CSV 明细表一键复制。
2. **⚡ 宽带速率与存储容量换算器**
   - 一键换算运营商签约宽带（`Mbps`）与实际软件下载满速（`MB/s`），内置 100M / 300M / 500M / 千兆 / 2.5G / 万兆预设并自动估算大文件下载耗时。
   - 精确换算硬盘标称容量（1000 进制）与 Windows 资源管理器实际显示容量（1024 进制），并给出分区常用 MiB 数值。
3. **🔌 常用网络端口与协议速查库**
   - 内置 30+ 高频系统/网络/数据库/NAS/代理端口（涵盖 SSH 22、SMB 445、KMS 1688、RDP 3389、PVE 8006、WireGuard 51820、FRP、MySQL、Redis 等）。
   - 支持关键词实时搜索、分类筛选与高危暴露端口安全提示。
4. **🖥️ PC 装机电源功率估算器 (PSU Calculator)**
   - 按 CPU 满载功耗、显卡型号（含 RTX 40/50 系、RX 7000 系、核显）、内存条数、SSD/HDD 数量及散热方案实时计算整机满载功耗。
   - 基于 80Plus 黄金效率负载区间（50%~75%）自动推荐额定电源瓦数与 ATX 3.0 选型建议。
5. **⌨️ Windows / Linux 运维排障命令生成器**
   - 输入目标主机、端口与 SSH 跳板机信息，自动生成 `Test-NetConnection`、`netstat`、`tracert`、`nslookup`、`nc`、`ss`、`curl` 握手耗时检测与 `SSH -L` 本地端口转发命令，一键复制执行。

---

## 🚀 本地运行或部署

无需安装 Node.js 或任何构建工具：

```bash
git clone https://github.com/xiaoA0v0/NetKit-Web.git
```

直接用浏览器打开 `index.html` 即可离线使用，或通过 GitHub Pages 一键托管。

---

## 📄 开源协议

本项目基于 [MIT License](./LICENSE) 开源。
