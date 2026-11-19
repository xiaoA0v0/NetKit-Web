/* ============================================================================
 * NetKit Web — 极客网络 · 硬件 · 系统在线工具台
 * Author: xiaoA0v0 (fanzhenwei) | https://github.com/xiaoA0v0/NetKit-Web
 * ========================================================================== */

(function () {
  'use strict';

  // ==================== 通用工具函数 ====================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  let toastTimer = null;
  function showToast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  async function copyText(text, label = '已复制到剪贴板') {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`✅ ${label}`);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(`✅ ${label}`);
    }
  }

  // ==================== 标签页切换 ====================
  $$('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      $$('.tab-btn').forEach((b) => {
        const active = b === btn;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', String(active));
      });
      $$('.panel').forEach((p) => {
        p.classList.toggle('active', p.id === `panel-${target}`);
      });
    });
  });

  // ==================== 1. IPv4 / CIDR 子网计算器 ====================
  function parseIPv4(str) {
    const parts = str.trim().split('.');
    if (parts.length !== 4) return null;
    let num = 0;
    for (const part of parts) {
      if (!/^\d+$/.test(part)) return null;
      const n = Number(part);
      if (n < 0 || n > 255) return null;
      num = ((num << 8) | n) >>> 0;
    }
    return num >>> 0;
  }

  function intToIPv4(n) {
    return [
      (n >>> 24) & 255,
      (n >>> 16) & 255,
      (n >>> 8) & 255,
      n & 255,
    ].join('.');
  }

  function prefixToMask(prefix) {
    if (prefix === 0) return 0;
    return (0xffffffff << (32 - prefix)) >>> 0;
  }

  function classifyIPv4(ipInt) {
    const a = (ipInt >>> 24) & 255;
    const b = (ipInt >>> 16) & 255;
    if (a === 10) return '私网地址 (RFC 1918 A类)';
    if (a === 172 && b >= 16 && b <= 31) return '私网地址 (RFC 1918 B类)';
    if (a === 192 && b === 168) return '私网地址 (RFC 1918 C类)';
    if (a === 100 && b >= 64 && b <= 127) return '运营商级 NAT (CGNAT / RFC 6598)';
    if (a === 127) return '本机回环地址 (Loopback)';
    if (a === 169 && b === 254) return '链路本地地址 (APIPA)';
    if (a >= 224 && a <= 239) return '组播地址 (Multicast D类)';
    if (a >= 240) return '保留地址 (E类)';
    return '公网可路由地址 (Public)';
  }

  function calcSubnetDetails(ipInt, prefix) {
    const mask = prefixToMask(prefix);
    const wildcard = (~mask) >>> 0;
    const network = (ipInt & mask) >>> 0;
    const broadcast = (network | wildcard) >>> 0;
    const total = Math.pow(2, 32 - prefix);

    let firstHost, lastHost, usable;
    if (prefix === 32) {
      firstHost = network;
      lastHost = network;
      usable = 1;
    } else if (prefix === 31) {
      firstHost = network;
      lastHost = broadcast;
      usable = 2;
    } else {
      firstHost = (network + 1) >>> 0;
      lastHost = (broadcast - 1) >>> 0;
      usable = Math.max(0, total - 2);
    }

    return {
      cidr: `${intToIPv4(network)}/${prefix}`,
      network: intToIPv4(network),
      networkInt: network,
      broadcast: intToIPv4(broadcast),
      mask: intToIPv4(mask),
      wildcard: intToIPv4(wildcard),
      firstHost: intToIPv4(firstHost),
      lastHost: intToIPv4(lastHost),
      total,
      usable,
      type: classifyIPv4(network),
    };
  }

  let latestSubnetsText = '';

  function renderSubnet() {
    const ipInput = $('#cidr-ip');
    const prefixInput = $('#cidr-prefix');
    const splitSelect = $('#cidr-split');
    const errBox = $('#subnet-error');

    let raw = ipInput.value.trim();
    if (raw.includes('/')) {
      const [ipPart, prePart] = raw.split('/');
      const parsedPre = Number(prePart);
      if (!Number.isNaN(parsedPre) && parsedPre >= 1 && parsedPre <= 32) {
        prefixInput.value = String(parsedPre);
      }
      raw = ipPart.trim();
    }

    const prefix = Number(prefixInput.value);
    $('#cidr-prefix-val').textContent = `/${prefix}`;

    const ipInt = parseIPv4(raw);
    if (ipInt === null) {
      errBox.textContent = '⚠️ 请输入合法的 IPv4 地址（例如 192.168.1.10 或 10.0.0.1/22）';
      errBox.classList.remove('hidden');
      return;
    }
    errBox.classList.add('hidden');

    const info = calcSubnetDetails(ipInt, prefix);
    const stats = [
      { label: '标准 CIDR 网段', value: info.cidr, cls: 'accent' },
      { label: '子网掩码 (Netmask)', value: info.mask, cls: '' },
      { label: '可用主机范围', value: `${info.firstHost} ~ ${info.lastHost}`, cls: 'green' },
      { label: '可用主机数 / 总数', value: `${info.usable.toLocaleString()} / ${info.total.toLocaleString()}`, cls: 'amber' },
      { label: '网络地址 (Network)', value: info.network, cls: '' },
      { label: '广播地址 (Broadcast)', value: info.broadcast, cls: '' },
      { label: '反掩码 (Wildcard)', value: info.wildcard, cls: '' },
      { label: '地址类型', value: info.type, cls: '' },
    ];

    $('#subnet-stats').innerHTML = stats
      .map(
        (s) => `
      <div class="stat-item" data-copy="${s.value}" title="点击复制">
        <div class="stat-label">${s.label}</div>
        <div class="stat-value ${s.cls}">${s.value}</div>
      </div>`
      )
      .join('');

    $$('#subnet-stats .stat-item').forEach((el) => {
      el.addEventListener('click', () => copyText(el.dataset.copy, `已复制 ${el.dataset.copy}`));
    });

    // Render 32-bit binary grid
    const binStr = ipInt.toString(2).padStart(32, '0');
    let binHtml = '';
    for (let oct = 0; oct < 4; oct++) {
      binHtml += '<div class="octet">';
      for (let b = 0; b < 8; b++) {
        const idx = oct * 8 + b;
        const cls = idx < prefix ? 'net' : 'host';
        binHtml += `<span class="bit ${cls}">${binStr[idx]}</span>`;
      }
      binHtml += '</div>';
    }
    $('#subnet-binary').innerHTML = binHtml;

    // Subnet splitting
    const splitCount = Number(splitSelect.value);
    const splitWrap = $('#subnet-split-wrap');
    const splitBody = $('#subnet-split-body');
    const extraBits = Math.log2(splitCount);
    const newPrefix = prefix + extraBits;

    if (splitCount > 1 && newPrefix <= 32) {
      const step = Math.pow(2, 32 - newPrefix);
      const rows = [];
      const lines = ['#,子网CIDR,网络地址,可用范围,广播地址,可用主机数'];
      for (let i = 0; i < splitCount; i++) {
        const subNetInt = (info.networkInt + i * step) >>> 0;
        const sub = calcSubnetDetails(subNetInt, newPrefix);
        rows.push(`
          <tr>
            <td class="mono">${i + 1}</td>
            <td class="mono" style="color:var(--accent);font-weight:700">${sub.cidr}</td>
            <td class="mono">${sub.network}</td>
            <td class="mono" style="color:var(--green)">${sub.firstHost} ~ ${sub.lastHost}</td>
            <td class="mono">${sub.broadcast}</td>
            <td class="mono">${sub.usable.toLocaleString()}</td>
          </tr>
        `);
        lines.push(`${i + 1},${sub.cidr},${sub.network},${sub.firstHost} ~ ${sub.lastHost},${sub.broadcast},${sub.usable}`);
      }
      splitBody.innerHTML = rows.join('');
      latestSubnetsText = lines.join('\n');
      splitWrap.classList.remove('hidden');
    } else {
      splitWrap.classList.add('hidden');
      if (splitCount > 1 && newPrefix > 32) {
        errBox.textContent = `⚠️ 当前前缀 /${prefix} 主机位不足，无法继续拆分为 ${splitCount} 个子网。`;
        errBox.classList.remove('hidden');
      }
    }
  }

  $('#cidr-ip').addEventListener('input', renderSubnet);
  $('#cidr-prefix').addEventListener('input', renderSubnet);
  $('#cidr-split').addEventListener('change', renderSubnet);
  $$('[data-cidr]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const [ip, pre] = chip.dataset.cidr.split('/');
      $('#cidr-ip').value = ip;
      $('#cidr-prefix').value = pre;
      renderSubnet();
    });
  });
  $('#btn-copy-subnets').addEventListener('click', () => {
    if (latestSubnetsText) copyText(latestSubnetsText, '子网划分明细表 (CSV) 已复制');
  });

  // ==================== 2. 宽带速率与存储容量换算 ====================
  function formatDuration(sec) {
    if (!Number.isFinite(sec) || sec <= 0) return '0 秒';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.round(sec % 60);
    const parts = [];
    if (h > 0) parts.push(`${h} 小时`);
    if (m > 0) parts.push(`${m} 分`);
    if (s > 0 || parts.length === 0) parts.push(`${s} 秒`);
    return parts.join(' ');
  }

  function renderBandwidth() {
    const mbps = Math.max(0.1, Number($('#bw-mbps').value) || 100);
    const fileGB = Math.max(0.01, Number($('#bw-filesize').value) || 10);

    const theoreticalMBs = mbps / 8;
    const realMBs = theoreticalMBs * 0.92; // 约 8% TCP/IP + 以太网帧头开销
    const fileMB = fileGB * 1024;
    const theorySec = fileMB / theoreticalMBs;
    const realSec = fileMB / realMBs;

    const items = [
      { label: '理论最高下载速度', value: `${theoreticalMBs.toFixed(2)} MB/s`, cls: 'accent' },
      { label: '实际常见满速 (约 92%)', value: `${realMBs.toFixed(2)} MB/s`, cls: 'green' },
      { label: `下载 ${fileGB} GB 理论耗时`, value: formatDuration(theorySec), cls: '' },
      { label: `下载 ${fileGB} GB 实际预估`, value: formatDuration(realSec), cls: 'amber' },
    ];
    $('#bw-results').innerHTML = items
      .map(
        (i) => `
      <div class="stat-item">
        <div class="stat-label">${i.label}</div>
        <div class="stat-value ${i.cls}">${i.value}</div>
      </div>`
      )
      .join('');
  }

  function renderDisk() {
    const size = Math.max(1, Number($('#disk-size').value) || 1);
    const unit = $('#disk-unit').value;
    const bytes = unit === 'TB' ? size * 1e12 : size * 1e9;
    const gib = bytes / Math.pow(1024, 3);
    const tib = bytes / Math.pow(1024, 4);
    const ratio = unit === 'TB' ? (tib / size) * 100 : (gib / size) * 100;

    const winDisplay = tib >= 1 ? `${tib.toFixed(2)} TB (${gib.toFixed(0)} GB)` : `${gib.toFixed(1)} GB`;
    const items = [
      { label: 'Windows 资源管理器显示', value: winDisplay, cls: 'accent' },
      { label: '折算比例 (1000 vs 1024)', value: `${ratio.toFixed(2)}%`, cls: 'green' },
      { label: '精确总字节数 (Bytes)', value: bytes.toLocaleString(), cls: '' },
      { label: '换算为 MiB (分区常用值)', value: `${Math.floor(bytes / (1024 * 1024)).toLocaleString()} MB`, cls: 'amber' },
    ];
    $('#disk-results').innerHTML = items
      .map(
        (i) => `
      <div class="stat-item">
        <div class="stat-label">${i.label}</div>
        <div class="stat-value ${i.cls}">${i.value}</div>
      </div>`
      )
      .join('');
  }

  $('#bw-mbps').addEventListener('input', renderBandwidth);
  $('#bw-filesize').addEventListener('input', renderBandwidth);
  $$('.bw-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      $('#bw-mbps').value = btn.dataset.mbps;
      renderBandwidth();
    });
  });

  $('#disk-size').addEventListener('input', renderDisk);
  $('#disk-unit').addEventListener('change', renderDisk);
  $$('.disk-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      $('#disk-size').value = btn.dataset.size;
      $('#disk-unit').value = btn.dataset.unit;
      renderDisk();
    });
  });

  // ==================== 3. 常用网络端口速查 ====================
  const PORTS_DB = [
    { port: '20 / 21', proto: 'TCP', name: 'FTP', cat: 'net', danger: true, desc: '文件传输协议（明文传输，公网建议改用 SFTP）' },
    { port: '22', proto: 'TCP', name: 'SSH / SFTP', cat: 'sys', danger: true, desc: 'Linux/网络设备安全远程登录（公网建议禁密码仅用密钥或改端口）' },
    { port: '23', proto: 'TCP', name: 'Telnet', cat: 'sys', danger: true, desc: '明文远程终端（极不安全，严禁暴露到公网）' },
    { port: '25', proto: 'TCP', name: 'SMTP', cat: 'net', danger: false, desc: '邮件发送协议（家用宽带通常默认封禁 25 端口）' },
    { port: '53', proto: 'TCP/UDP', name: 'DNS', cat: 'net', danger: false, desc: '域名解析服务（常规查询走 UDP，区域传输/大包走 TCP）' },
    { port: '67 / 68', proto: 'UDP', name: 'DHCP', cat: 'net', danger: false, desc: '局域网动态 IP 地址分配服务' },
    { port: '80', proto: 'TCP', name: 'HTTP', cat: 'web', danger: false, desc: '超文本传输协议（家用宽带公网通常封禁 80 端口）' },
    { port: '123', proto: 'UDP', name: 'NTP', cat: 'net', danger: false, desc: '网络时间同步协议' },
    { port: '161 / 162', proto: 'UDP', name: 'SNMP', cat: 'net', danger: true, desc: '路由器/交换机/NAS 网络监控协议' },
    { port: '443', proto: 'TCP/UDP', name: 'HTTPS / QUIC', cat: 'web', danger: false, desc: '加密 Web 访问（HTTP/3 QUIC 使用 UDP 443）' },
    { port: '445', proto: 'TCP', name: 'SMB / CIFS', cat: 'sys', danger: true, desc: 'Windows 文件共享与 NAS 挂载（永恒之蓝高危端口，严禁公网暴露）' },
    { port: '514', proto: 'UDP', name: 'Syslog', cat: 'net', danger: false, desc: '系统与网络设备远程日志收集' },
    { port: '853', proto: 'TCP/UDP', name: 'DoT / DoQ', cat: 'net', danger: false, desc: 'DNS over TLS / DNS over QUIC 加密域名解析' },
    { port: '1080', proto: 'TCP/UDP', name: 'SOCKS5', cat: 'web', danger: false, desc: '常见本地代理协议默认监听端口' },
    { port: '1433', proto: 'TCP', name: 'SQL Server', cat: 'db', danger: true, desc: 'Microsoft SQL Server 数据库服务' },
    { port: '1688', proto: 'TCP', name: 'KMS', cat: 'sys', danger: false, desc: '微软 KMS 批量授权激活服务端口（Windows & Office）' },
    { port: '1883', proto: 'TCP', name: 'MQTT', cat: 'net', danger: false, desc: '物联网 / 智能家居（Home Assistant）消息队列' },
    { port: '2375 / 2376', proto: 'TCP', name: 'Docker API', cat: 'sys', danger: true, desc: 'Docker Daemon 远程接口（2375 无加密，公网暴露等于直接交出 root）' },
    { port: '3306', proto: 'TCP', name: 'MySQL / MariaDB', cat: 'db', danger: true, desc: '主流关系型数据库默认端口（建议仅监听 127.0.0.1 或内网）' },
    { port: '3389', proto: 'TCP/UDP', name: 'RDP 远程桌面', cat: 'sys', danger: true, desc: 'Windows 远程桌面协议（公网易遭爆破，建议通过 VPN/内网穿透访问）' },
    { port: '5000 / 5001', proto: 'TCP', name: 'Synology DSM', cat: 'web', danger: false, desc: '群晖 NAS Web 管理后台（HTTP 5000 / HTTPS 5001）' },
    { port: '5432', proto: 'TCP', name: 'PostgreSQL', cat: 'db', danger: true, desc: 'PostgreSQL 数据库默认端口' },
    { port: '5900', proto: 'TCP', name: 'VNC', cat: 'sys', danger: true, desc: '远程图形桌面控制（默认安全性较弱）' },
    { port: '6379', proto: 'TCP', name: 'Redis', cat: 'db', danger: true, desc: '内存键值缓存数据库（务必设置强密码并禁止公网监听）' },
    { port: '7000 / 7500', proto: 'TCP', name: 'FRP', cat: 'net', danger: false, desc: '开源内网穿透工具 frps 通信端口（7000）与控制台（7500）' },
    { port: '7890', proto: 'TCP/UDP', name: 'HTTP/SOCKS 混合代理', cat: 'web', danger: false, desc: '常见本地科学/规则代理客户端默认混合端口' },
    { port: '8006', proto: 'TCP', name: 'Proxmox VE (PVE)', cat: 'sys', danger: false, desc: 'PVE 虚拟化宿主机 HTTPS Web 管理面板' },
    { port: '8080 / 8443', proto: 'TCP', name: 'HTTP/HTTPS 备用', cat: 'web', danger: false, desc: '常用 Web 应用、反向代理或测试服务端口' },
    { port: '8123', proto: 'TCP', name: 'Home Assistant', cat: 'web', danger: false, desc: '开源智能家居中枢 Web 面板默认端口' },
    { port: '9000', proto: 'TCP', name: 'Portainer / PHP-FPM', cat: 'web', danger: false, desc: 'Docker 可视化管理 Portainer 或 PHP-FPM 常用端口' },
    { port: '25565', proto: 'TCP', name: 'Minecraft Java', cat: 'net', danger: false, desc: '我的世界 Java 版联机服务器默认端口' },
    { port: '27017', proto: 'TCP', name: 'MongoDB', cat: 'db', danger: true, desc: 'MongoDB 文档数据库默认端口' },
    { port: '51820', proto: 'UDP', name: 'WireGuard', cat: 'net', danger: false, desc: '高性能现代开源 VPN 异地组网默认端口' },
  ];

  const CAT_LABELS = { web: 'Web / 代理', sys: '系统 / 远程', db: '数据库', net: '组网 / 基础' };
  let activePortCat = 'all';

  function renderPorts() {
    const q = $('#port-search').value.trim().toLowerCase();
    const filtered = PORTS_DB.filter((item) => {
      if (activePortCat === 'danger' && !item.danger) return false;
      if (activePortCat !== 'all' && activePortCat !== 'danger' && item.cat !== activePortCat) return false;
      if (!q) return true;
      return (
        item.port.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.proto.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q)
      );
    });

    if (filtered.length === 0) {
      $('#ports-body').innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px;">未找到匹配的端口记录</td></tr>';
      return;
    }

    $('#ports-body').innerHTML = filtered
      .map((p) => {
        const protoCls = p.proto === 'TCP' ? 'badge-tcp' : p.proto === 'UDP' ? 'badge-udp' : 'badge-both';
        const dangerTag = p.danger ? ' <span class="badge badge-danger">高危注意</span>' : '';
        return `
        <tr>
          <td class="mono" style="color:var(--accent);font-weight:700;white-space:nowrap;">${p.port}</td>
          <td><span class="badge ${protoCls}">${p.proto}</span></td>
          <td style="font-weight:600;white-space:nowrap;">${p.name}</td>
          <td style="white-space:nowrap;color:var(--muted);">${CAT_LABELS[p.cat] || p.cat}</td>
          <td>${p.desc}${dangerTag}</td>
        </tr>`;
      })
      .join('');
  }

  $('#port-search').addEventListener('input', renderPorts);
  $$('#port-filters .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      $$('#port-filters .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      activePortCat = chip.dataset.cat;
      renderPorts();
    });
  });

  // ==================== 4. PC 装机电源功率估算器 ====================
  const STANDARD_PSUS = [350, 450, 550, 650, 750, 850, 1000, 1200, 1300, 1600];

  function renderPsu() {
    const cpuW = Number($('#psu-cpu').value);
    const gpuW = Number($('#psu-gpu').value);
    const ramCount = Number($('#psu-ram').value);
    const ssdCount = Number($('#psu-ssd').value);
    const hddCount = Number($('#psu-hdd').value);
    const coolW = Number($('#psu-cool').value);

    $('#psu-ram-val').textContent = `${ramCount} 根`;
    $('#psu-ssd-val').textContent = `${ssdCount} 块`;
    $('#psu-hdd-val').textContent = `${hddCount} 块`;

    const boardAndUsbW = 45;
    const ramW = ramCount * 5;
    const storageW = ssdCount * 6 + hddCount * 10;
    const totalW = cpuW + gpuW + boardAndUsbW + ramW + storageW + coolW;

    // 推荐按峰值负载率 60% ~ 70% 预留瞬时功耗与老化余量
    const targetW = totalW * 1.45;
    const recW = STANDARD_PSUS.find((w) => w >= targetW) || Math.ceil(targetW / 100) * 100;
    const loadPct = Math.min(100, Math.round((totalW / recW) * 100));

    $('#psu-rec-watt').textContent = `${recW}W`;
    $('#psu-total-watt').textContent = `${totalW}W`;
    $('#psu-load-pct').textContent = `满载负载率约 ${loadPct}%`;
    $('#psu-meter-fill').style.width = `${loadPct}%`;

    const tip =
      gpuW >= 285
        ? '建议选择原生支持 12V-2x6 / ATX 3.0+ 的 80Plus 金牌或白金电源'
        : gpuW >= 115
        ? '建议选择大厂 80Plus 铜牌/金牌直出或全模组电源'
        : '核显低功耗平台，选择一线品牌稳定 80Plus 认证电源即可';
    $('#psu-atx-tip').textContent = tip;

    const rows = [
      ['处理器 (CPU 满载睿频)', `${cpuW} W`],
      ['显卡 (GPU 典型满载)', `${gpuW} W`],
      ['主板芯片组 + 外设 USB', `${boardAndUsbW} W`],
      [`内存 (${ramCount} 根) + 硬盘 (${ssdCount} SSD / ${hddCount} HDD)`, `${ramW + storageW} W`],
      ['水冷 / 风扇 / RGB 灯光', `${coolW} W`],
    ];
    $('#psu-breakdown').innerHTML = rows
      .map(([k, v]) => `<div class="breakdown-row"><span class="muted">${k}</span><strong class="mono">${v}</strong></div>`)
      .join('');
  }

  ['#psu-cpu', '#psu-gpu', '#psu-ram', '#psu-ssd', '#psu-hdd', '#psu-cool'].forEach((id) => {
    $(id).addEventListener('input', renderPsu);
    $(id).addEventListener('change', renderPsu);
  });

  // ==================== 5. 运维命令生成器 ====================
  function renderCommands() {
    const host = ($('#cmd-host').value || 'github.com').trim();
    const port = Number($('#cmd-port').value) || 443;
    const localPort = Number($('#cmd-local-port').value) || 8080;
    const sshUser = ($('#cmd-ssh-user').value || 'root@192.168.1.2').trim();

    const cmds = [
      {
        title: 'Windows — PowerShell 测试 TCP 端口连通性',
        code: `Test-NetConnection -ComputerName ${host} -Port ${port}`,
      },
      {
        title: 'Windows — 排查占用指定端口的进程 PID',
        code: `netstat -ano | findstr :${port}`,
      },
      {
        title: 'Windows — 路由追踪 (不反查主机名，加速输出)',
        code: `tracert -d ${host}`,
      },
      {
        title: 'Windows — 强制指定阿里 DNS 解析域名',
        code: `nslookup ${host} 223.5.5.5`,
      },
      {
        title: 'Linux / macOS — 测试端口连通性与响应耗时',
        code: `nc -zv -w 3 ${host} ${port}`,
      },
      {
        title: 'Linux — 实时查看所有监听的 TCP/UDP 端口与进程',
        code: `ss -tulnp | grep :${port}`,
      },
      {
        title: 'curl — 仅查看 HTTP 响应头与 TLS 握手耗时',
        code: `curl -I -s -w "DNS:%{time_namelookup}s TCP:%{time_connect}s TLS:%{time_appconnect}s Total:%{time_total}s\\n" https://${host}:${port}`,
      },
      {
        title: 'SSH 本地端口转发（通过跳板机安全访问内网服务）',
        code: `ssh -N -L 127.0.0.1:${localPort}:${host}:${port} ${sshUser}`,
      },
    ];

    $('#cmd-list').innerHTML = cmds
      .map(
        (c, idx) => `
      <div class="cmd-card">
        <div class="cmd-card-head">
          <span class="cmd-title">${c.title}</span>
          <button class="btn-ghost cmd-copy-btn" data-idx="${idx}">复制</button>
        </div>
        <div class="cmd-code">${c.code.replace(/</g, '&lt;')}</div>
      </div>`
      )
      .join('');

    $$('.cmd-copy-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = cmds[Number(btn.dataset.idx)];
        copyText(item.code, '命令已复制到剪贴板');
      });
    });
  }

  ['#cmd-host', '#cmd-port', '#cmd-local-port', '#cmd-ssh-user'].forEach((id) => {
    $(id).addEventListener('input', renderCommands);
  });

  // ==================== 初始化渲染 ====================
  renderSubnet();
  renderBandwidth();
  renderDisk();
  renderPorts();
  renderPsu();
  renderCommands();
})();
