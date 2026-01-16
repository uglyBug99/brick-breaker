# 弹弹乐 | Bounce Joy

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/Platform-Web-orange" alt="Platform">
</p>

一款现代霓虹风格的网页弹球消除游戏。  
A modern neon-style web-based brick breaker game.

---

## 🎮 游戏特色 | Features

### 中文

- **霓虹视觉风格** - 深色主题配合绚丽的霓虹发光效果
- **墙壁保护系统** - 方块被异形墙壁包围，只有狭窄入口可进入
- **福利球道具** - 10%的方块是金色福利球，击中后掉落道具
  - 💥 **裂变** - 每个小球分裂成3个
  - 🔵 **多球** - 从挡板发射3个新球
- **粒子特效** - 方块破碎时产生同色粒子爆炸效果
- **响应式设计** - 完美适配手机和电脑
- **3个精心设计的关卡**

### English

- **Neon Visual Style** - Dark theme with stunning neon glow effects
- **Wall Protection System** - Blocks are surrounded by irregular walls with narrow entrances
- **Power-up System** - 10% of blocks are golden power-up blocks
  - 💥 **Split** - Each ball splits into 3
  - 🔵 **Multi-ball** - Launch 3 new balls from paddle
- **Particle Effects** - Blocks explode with same-colored particles
- **Responsive Design** - Perfect for both mobile and desktop
- **3 Carefully Designed Levels**

---

## 🕹️ 操作说明 | Controls

| 平台 Platform | 操作 Control |
|---------------|--------------|
| 🖥️ 电脑 Desktop | 鼠标左右移动 / Move mouse left/right |
| 📱 手机 Mobile | 触摸滑动 / Touch and swipe |

---

## 🗺️ 关卡介绍 | Levels

### 第一关：开放堡垒 | Level 1: Open Fortress
- 底部和侧面有入口
- 内部有水平隔板
- Entrances at bottom and sides
- Horizontal barriers inside

### 第二关：V形峡谷 | Level 2: V-shaped Valley
- 两侧是V形倾斜墙壁
- 底部完全敞开
- V-shaped sloping walls on both sides
- Bottom completely open

### 第三关：环形迷宫 | Level 3: Ring Maze
- 中央空心区域
- 四面都有入口
- Hollow center area
- Entrances on all four sides

---

## 🚀 快速开始 | Quick Start

### 方法一：直接打开 | Method 1: Direct Open

双击 `index.html` 在浏览器中打开即可。  
Double-click `index.html` to open in browser.

### 方法二：本地服务器 | Method 2: Local Server

```bash
# 使用 npx serve | Using npx serve
npx serve .

# 或使用 Python | Or using Python
python -m http.server 3000
```

然后访问 / Then visit: `http://localhost:3000`

---

## 📁 项目结构 | Project Structure

```
bounce-joy/
├── index.html      # 主页面 | Main HTML page
├── styles.css      # 样式表 | Stylesheet
├── game.js         # 游戏逻辑 | Game logic
├── README.md       # 说明文档 | Documentation
└── LICENSE         # 许可证 | License
```

---

## ⚙️ 技术栈 | Tech Stack

- **HTML5 Canvas** - 游戏渲染 | Game rendering
- **Vanilla JavaScript** - 游戏逻辑 | Game logic
- **CSS3** - 界面样式 | UI styling
- **Google Fonts (Orbitron)** - 霓虹字体 | Neon typography

---

## 🎨 游戏配置 | Configuration

可在 `game.js` 中的 `CONFIG` 对象修改以下参数：

You can modify the following parameters in the `CONFIG` object in `game.js`:

| 参数 Parameter | 默认值 Default | 说明 Description |
|----------------|----------------|------------------|
| `INITIAL_LIVES` | 3 | 初始生命数 / Initial lives |
| `MAX_LEVEL` | 3 | 最大关卡数 / Max levels |
| `BALL_RADIUS` | 5 | 小球半径 / Ball radius |
| `BALL_BASE_SPEED` | 6 | 小球基础速度 / Ball base speed |
| `POWERUP_CHANCE` | 0.10 | 福利球概率 / Power-up chance |
| `PADDLE_WIDTH_RATIO` | 0.28 | 挡板宽度比例 / Paddle width ratio |

---

## 📸 游戏截图 | Screenshots

### 开始界面 | Start Screen
```
  ╔══════════════════════╗
  ║     弹 弹  乐        ║
  ║    BOUNCE JOY        ║
  ║                      ║
  ║   [ 开始游戏 ]       ║
  ╚══════════════════════╝
```

### 游戏画面 | Gameplay
```
  ┌──────────────────────┐
  │ 分数:100  关卡1  ❤❤❤ │
  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
  │ ▓▓▓★▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
  │ ▓▓▓▓▓▓▓▓▓▓▓▓★▓▓▓▓▓▓▓ │
  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
  │          ●           │
  │                      │
  │      ═══════════     │
  └──────────────────────┘
```

---

## 🔧 开发计划 | Roadmap

- [ ] 添加更多关卡 | Add more levels
- [ ] 添加音效系统 | Add sound effects
- [ ] 添加排行榜 | Add leaderboard
- [ ] 添加更多道具类型 | Add more power-up types
- [ ] 添加 Boss 关卡 | Add boss levels

---

## 📄 许可证 | License

本项目采用 MIT 许可证。  
This project is licensed under the MIT License.

---

## 👨‍💻 作者 | Author

Made with ❤️ and ☕

---

## 🙏 致谢 | Acknowledgments

- 灵感来源于经典的打砖块游戏
- Inspired by the classic Breakout game
- 字体: [Google Fonts - Orbitron](https://fonts.google.com/specimen/Orbitron)
