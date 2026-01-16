/**
 * ============================================
 * 弹弹乐 (Bounce Joy) - 弹球消除游戏
 * ============================================
 * 
 * 一款具有现代霓虹视觉风格的经典弹球消除游戏
 * 
 * 主要特性：
 * - 墙壁保护系统
 * - 福利球道具系统（裂变、多球）
 * - 粒子特效系统
 * - 响应式画布
 */

// ============================================
// 游戏配置常量
// ============================================
const CONFIG = {
    // 游戏基础设置
    INITIAL_LIVES: 3,
    MAX_LEVEL: 3,

    // 挡板设置
    PADDLE_WIDTH_RATIO: 0.28,
    PADDLE_HEIGHT: 12,
    PADDLE_MARGIN_BOTTOM: 30,

    // 小球设置
    BALL_RADIUS: 5,
    BALL_BASE_SPEED: 6,
    BALL_SPEED_INCREMENT: 0.5,
    BALL_MAX_SPEED: 10,

    // 方块设置 - 与小球同尺寸
    BRICK_SIZE: 10,              // 方块尺寸（正方形，与小球直径近似）
    BRICK_PADDING: 2,
    BRICK_TOP_OFFSET: 50,

    // 墙壁设置
    WALL_COLOR: '#444466',       // 墙壁颜色（暗灰蓝）
    WALL_GLOW: '#6666aa',        // 墙壁发光色

    // 福利球设置
    POWERUP_CHANCE: 0.10,        // 10%概率是福利球（1/10）
    POWERUP_FALL_SPEED: 2,       // 道具下落速度
    POWERUP_SIZE: 15,            // 道具大小

    // 粒子系统设置
    PARTICLE_COUNT: 8,
    PARTICLE_LIFETIME: 30,
    PARTICLE_SPEED: 3,

    // 霓虹颜色调色板
    NEON_COLORS: [
        '#00f5ff', '#ff00ff', '#bf00ff', '#ff6b00',
        '#39ff14', '#ffff00', '#ff3366', '#00ff88',
    ],

    // 福利球特殊颜色
    POWERUP_COLOR: '#ffd700',    // 金色福利球
};

// ============================================
// 道具类型枚举
// ============================================
const PowerUpType = {
    SPLIT: 'split',         // 小球裂变（1变3）
    MULTI_BALL: 'multiBall' // 重新发出3个小球
};

// ============================================
// 游戏状态枚举
// ============================================
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_COMPLETE: 'levelComplete',
    GAME_OVER: 'gameOver',
    WIN: 'win'
};

// ============================================
// 工具函数
// ============================================
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// ============================================
// 粒子类
// ============================================
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;

        const angle = randomRange(0, Math.PI * 2);
        const speed = randomRange(1, CONFIG.PARTICLE_SPEED);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.radius = randomRange(2, 4);
        this.lifetime = CONFIG.PARTICLE_LIFETIME;
        this.maxLifetime = CONFIG.PARTICLE_LIFETIME;
        this.gravity = 0.08;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.lifetime--;
        return this.lifetime > 0;
    }

    draw(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ============================================
// 道具类 - 从福利球掉落
// ============================================
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = CONFIG.POWERUP_SIZE;
        this.vy = CONFIG.POWERUP_FALL_SPEED;
        this.active = true;

        // 根据类型设置颜色和符号
        if (type === PowerUpType.SPLIT) {
            this.color = '#ff00ff';  // 粉色 - 裂变
            this.symbol = '×3';
        } else {
            this.color = '#00f5ff';  // 青色 - 多球
            this.symbol = '+3';
        }

        // 动画效果
        this.angle = 0;
    }

    update(canvasHeight) {
        this.y += this.vy;
        this.angle += 0.1;

        // 超出屏幕则消失
        if (this.y > canvasHeight + this.size) {
            this.active = false;
        }

        return this.active;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        // 发光效果
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        // 绘制圆形道具
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // 绘制符号
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, this.x, this.y);

        ctx.restore();
    }

    // 检测与挡板碰撞
    checkPaddleCollision(paddle) {
        return this.y + this.size / 2 >= paddle.y &&
            this.y - this.size / 2 <= paddle.y + paddle.height &&
            this.x >= paddle.x &&
            this.x <= paddle.x + paddle.width;
    }
}

// ============================================
// 方块类 - 支持福利球
// ============================================
class Brick {
    constructor(x, y, size, color, isPowerUp = false) {
        this.x = x;
        this.y = y;
        this.width = size;
        this.height = size;
        this.color = color;
        this.visible = true;
        this.isPowerUp = isPowerUp; // 是否为福利球

        // 福利球有特殊的视觉效果
        if (isPowerUp) {
            this.glowIntensity = 0;
            this.glowDirection = 1;
        }
    }

    update() {
        // 福利球闪烁效果
        if (this.isPowerUp && this.visible) {
            this.glowIntensity += 0.05 * this.glowDirection;
            if (this.glowIntensity >= 1) this.glowDirection = -1;
            if (this.glowIntensity <= 0) this.glowDirection = 1;
        }
    }

    draw(ctx) {
        if (!this.visible) return;

        ctx.save();

        if (this.isPowerUp) {
            // 福利球：金色闪烁效果
            const glow = 10 + this.glowIntensity * 15;
            ctx.shadowBlur = glow;
            ctx.shadowColor = CONFIG.POWERUP_COLOR;
            ctx.fillStyle = CONFIG.POWERUP_COLOR;
        } else {
            // 普通方块
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.color;
        }

        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 福利球星号标记
        if (this.isPowerUp) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#000';
            ctx.font = `bold ${this.width * 0.6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', this.x + this.width / 2, this.y + this.height / 2);
        }

        ctx.restore();
    }
}

// ============================================
// 墙壁类 - 保护方块的坚固墙壁
// ============================================
class Wall {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = CONFIG.WALL_COLOR;
        this.glowColor = CONFIG.WALL_GLOW;
    }

    draw(ctx) {
        ctx.save();

        // 墙壁发光效果
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.glowColor;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 边缘高光
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.restore();
    }
}

// ============================================
// 挡板类
// ============================================
class Paddle {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth * CONFIG.PADDLE_WIDTH_RATIO;
        this.height = CONFIG.PADDLE_HEIGHT;
        this.x = (canvasWidth - this.width) / 2;
        this.y = canvasHeight - CONFIG.PADDLE_MARGIN_BOTTOM - this.height;
        this.canvasWidth = canvasWidth;
        this.color = '#00f5ff';
    }

    moveTo(targetX) {
        this.x = clamp(targetX - this.width / 2, 0, this.canvasWidth - this.width);
    }

    reset(canvasWidth, canvasHeight) {
        this.width = canvasWidth * CONFIG.PADDLE_WIDTH_RATIO;
        this.x = (canvasWidth - this.width) / 2;
        this.y = canvasHeight - CONFIG.PADDLE_MARGIN_BOTTOM - this.height;
        this.canvasWidth = canvasWidth;
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        const radius = this.height / 2;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, radius);
        ctx.fill();
        ctx.restore();
    }
}

// ============================================
// 小球类 - 支持多球
// ============================================
class Ball {
    constructor(canvasWidth, canvasHeight, level = 1, startX = null, startY = null, vx = null, vy = null) {
        this.radius = CONFIG.BALL_RADIUS;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        // 计算速度
        this.speed = Math.min(
            CONFIG.BALL_BASE_SPEED + (level - 1) * CONFIG.BALL_SPEED_INCREMENT,
            CONFIG.BALL_MAX_SPEED
        );

        // 位置初始化
        if (startX !== null && startY !== null) {
            this.x = startX;
            this.y = startY;
        } else {
            this.x = canvasWidth / 2;
            this.y = canvasHeight - CONFIG.PADDLE_MARGIN_BOTTOM - CONFIG.PADDLE_HEIGHT - this.radius - 5;
        }

        // 速度初始化
        if (vx !== null && vy !== null) {
            this.vx = vx;
            this.vy = vy;
        } else {
            const angle = randomRange(-Math.PI / 4, -3 * Math.PI / 4);
            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed;
        }

        this.color = '#ff00ff';
        this.active = true;
        this.trail = [];
        this.maxTrailLength = 6;
    }

    update(paddle, bricks, walls, onBrickHit, onWallHit) {
        if (!this.active) return false;

        // 尾迹
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) this.trail.shift();

        // 更新位置
        this.x += this.vx;
        this.y += this.vy;

        // 墙壁边界碰撞
        if (this.x - this.radius <= 0) {
            this.x = this.radius;
            this.vx = -this.vx;
        } else if (this.x + this.radius >= this.canvasWidth) {
            this.x = this.canvasWidth - this.radius;
            this.vx = -this.vx;
        }

        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.vy = -this.vy;
        }

        // 底部掉落
        if (this.y + this.radius >= this.canvasHeight) {
            this.active = false;
            return false;
        }

        // 墙壁碰撞
        this.checkWallCollision(walls, onWallHit);

        // 挡板碰撞
        this.checkPaddleCollision(paddle);

        // 方块碰撞
        this.checkBrickCollision(bricks, onBrickHit);

        return true;
    }

    checkWallCollision(walls, onWallHit) {
        for (const wall of walls) {
            // AABB碰撞检测
            const closestX = clamp(this.x, wall.x, wall.x + wall.width);
            const closestY = clamp(this.y, wall.y, wall.y + wall.height);

            const distX = this.x - closestX;
            const distY = this.y - closestY;
            const distance = Math.sqrt(distX * distX + distY * distY);

            if (distance <= this.radius) {
                // 计算碰撞面
                const overlapX = wall.width / 2 + this.radius - Math.abs(this.x - (wall.x + wall.width / 2));
                const overlapY = wall.height / 2 + this.radius - Math.abs(this.y - (wall.y + wall.height / 2));

                if (overlapX < overlapY) {
                    this.vx = -this.vx;
                    // 推出墙壁
                    if (this.x < wall.x + wall.width / 2) {
                        this.x = wall.x - this.radius;
                    } else {
                        this.x = wall.x + wall.width + this.radius;
                    }
                } else {
                    this.vy = -this.vy;
                    if (this.y < wall.y + wall.height / 2) {
                        this.y = wall.y - this.radius;
                    } else {
                        this.y = wall.y + wall.height + this.radius;
                    }
                }

                if (onWallHit) onWallHit(wall);
                break;
            }
        }
    }

    checkPaddleCollision(paddle) {
        if (this.y + this.radius >= paddle.y &&
            this.y - this.radius <= paddle.y + paddle.height &&
            this.vy > 0 &&
            this.x >= paddle.x && this.x <= paddle.x + paddle.width) {

            const hitPoint = (this.x - paddle.x) / paddle.width;
            const offset = hitPoint - 0.5;
            const maxAngle = Math.PI / 3;
            const angle = -Math.PI / 2 + offset * 2 * maxAngle;

            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed;
            this.y = paddle.y - this.radius;
        }
    }

    checkBrickCollision(bricks, onBrickHit) {
        for (const brick of bricks) {
            if (!brick.visible) continue;

            const closestX = clamp(this.x, brick.x, brick.x + brick.width);
            const closestY = clamp(this.y, brick.y, brick.y + brick.height);

            const distX = this.x - closestX;
            const distY = this.y - closestY;
            const distance = Math.sqrt(distX * distX + distY * distY);

            if (distance <= this.radius) {
                brick.visible = false;
                if (onBrickHit) onBrickHit(brick);

                const overlapX = brick.width / 2 + this.radius - Math.abs(this.x - (brick.x + brick.width / 2));
                const overlapY = brick.height / 2 + this.radius - Math.abs(this.y - (brick.y + brick.height / 2));

                if (overlapX < overlapY) {
                    this.vx = -this.vx;
                } else {
                    this.vy = -this.vy;
                }
                break;
            }
        }
    }

    /**
     * 小球裂变 - 返回2个新的分裂球
     */
    split() {
        const angle1 = Math.atan2(this.vy, this.vx) + Math.PI / 6;
        const angle2 = Math.atan2(this.vy, this.vx) - Math.PI / 6;

        return [
            new Ball(this.canvasWidth, this.canvasHeight, 1, this.x, this.y,
                Math.cos(angle1) * this.speed, Math.sin(angle1) * this.speed),
            new Ball(this.canvasWidth, this.canvasHeight, 1, this.x, this.y,
                Math.cos(angle2) * this.speed, Math.sin(angle2) * this.speed)
        ];
    }

    reset(canvasWidth, canvasHeight, level = 1) {
        this.x = canvasWidth / 2;
        this.y = canvasHeight - CONFIG.PADDLE_MARGIN_BOTTOM - CONFIG.PADDLE_HEIGHT - this.radius - 5;
        this.speed = Math.min(CONFIG.BALL_BASE_SPEED + (level - 1) * CONFIG.BALL_SPEED_INCREMENT, CONFIG.BALL_MAX_SPEED);

        const angle = randomRange(-Math.PI / 4, -3 * Math.PI / 4);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;

        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.active = true;
        this.trail = [];
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        // 尾迹
        for (let i = 0; i < this.trail.length; i++) {
            const pos = this.trail[i];
            const alpha = (i + 1) / this.trail.length * 0.3;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, this.radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }

        // 小球主体
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ============================================
// 主游戏类
// ============================================
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // UI元素
        this.startOverlay = document.getElementById('start-overlay');
        this.endOverlay = document.getElementById('end-overlay');
        this.levelOverlay = document.getElementById('level-overlay');
        this.endTitle = document.getElementById('end-title');
        this.endScore = document.getElementById('end-score');
        this.endLevel = document.getElementById('end-level');
        this.levelNumber = document.getElementById('level-number');

        // 游戏状态
        this.state = GameState.MENU;
        this.score = 0;
        this.lives = CONFIG.INITIAL_LIVES;
        this.level = 1;

        // 游戏对象
        this.paddle = null;
        this.balls = [];          // 多球数组
        this.bricks = [];
        this.walls = [];          // 墙壁数组
        this.particles = [];
        this.powerUps = [];       // 道具数组

        this.animationId = null;

        this.init();
    }

    init() {
        this.resizeCanvas();
        this.bindEvents();
        this.drawBackground();
    }

    resizeCanvas() {
        const container = document.getElementById('game-container');
        const aspectRatio = 9 / 16;
        let width = container.clientWidth;
        let height = container.clientHeight;

        if (width / height > aspectRatio) {
            width = height * aspectRatio;
        } else {
            height = width / aspectRatio;
        }

        this.canvas.width = Math.min(width, 450);
        this.canvas.height = this.canvas.width / aspectRatio;

        if (this.paddle) this.paddle.reset(this.canvas.width, this.canvas.height);
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            if (this.state === GameState.MENU) this.drawBackground();
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.state !== GameState.PLAYING) return;
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            this.paddle.moveTo((e.clientX - rect.left) * scaleX);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (this.state !== GameState.PLAYING) return;
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            this.paddle.moveTo((e.touches[0].clientX - rect.left) * scaleX);
        }, { passive: false });

        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('next-level-btn').addEventListener('click', () => this.startLevel());
    }

    startGame() {
        this.score = 0;
        this.lives = CONFIG.INITIAL_LIVES;
        this.level = 1;
        this.startOverlay.classList.add('hidden');
        this.showLevelOverlay();
    }

    showLevelOverlay() {
        this.levelNumber.textContent = this.level;
        this.levelOverlay.classList.remove('hidden');
        this.state = GameState.PAUSED;
    }

    startLevel() {
        this.levelOverlay.classList.add('hidden');

        this.paddle = new Paddle(this.canvas.width, this.canvas.height);
        this.balls = [new Ball(this.canvas.width, this.canvas.height, this.level)];
        this.particles = [];
        this.powerUps = [];

        this.createLevel();

        this.state = GameState.PLAYING;
        this.gameLoop();
    }

    /**
     * 创建关卡 - 带墙壁保护和小入口
     */
    createLevel() {
        this.bricks = [];
        this.walls = [];

        const brickSize = CONFIG.BRICK_SIZE;
        const padding = CONFIG.BRICK_PADDING;
        const canvasWidth = this.canvas.width;

        switch (this.level) {
            case 1:
                this.createLevel1(brickSize, padding, canvasWidth);
                break;
            case 2:
                this.createLevel2(brickSize, padding, canvasWidth);
                break;
            case 3:
                this.createLevel3(brickSize, padding, canvasWidth);
                break;
            default:
                this.createLevel1(brickSize, padding, canvasWidth);
        }
    }

    /**
     * 第一关：开放堡垒
     * 方块区域占画面1/2以上，底部有缺口入口，左右有斜向挡板
     */
    createLevel1(brickSize, padding, canvasWidth) {
        const canvasHeight = this.canvas.height;
        const cols = Math.floor((canvasWidth - 20) / (brickSize + padding));
        const rows = Math.floor((canvasHeight * 0.55) / (brickSize + padding)); // 占55%高度
        const startX = (canvasWidth - cols * (brickSize + padding)) / 2;
        const startY = CONFIG.BRICK_TOP_OFFSET;

        const wallThickness = 6;
        const areaWidth = cols * (brickSize + padding);
        const areaHeight = rows * (brickSize + padding);
        const gapWidth = brickSize * 4; // 入口宽度

        // 顶部完整横墙
        this.walls.push(new Wall(startX - wallThickness, startY - wallThickness, areaWidth + wallThickness * 2, wallThickness));

        // 左侧墙 - 上半部分
        this.walls.push(new Wall(startX - wallThickness, startY, wallThickness, areaHeight * 0.4));
        // 左侧墙 - 下半部分（留出入口）
        this.walls.push(new Wall(startX - wallThickness, startY + areaHeight * 0.6, wallThickness, areaHeight * 0.4));

        // 右侧墙 - 上半部分
        this.walls.push(new Wall(startX + areaWidth, startY, wallThickness, areaHeight * 0.4));
        // 右侧墙 - 下半部分（留出入口）
        this.walls.push(new Wall(startX + areaWidth, startY + areaHeight * 0.6, wallThickness, areaHeight * 0.4));

        // 底部墙 - 中间留大入口
        const bottomY = startY + areaHeight;
        const gap1End = startX + areaWidth * 0.35;
        const gap2Start = startX + areaWidth * 0.65;
        this.walls.push(new Wall(startX - wallThickness, bottomY, gap1End - startX + wallThickness, wallThickness));
        this.walls.push(new Wall(gap2Start, bottomY, startX + areaWidth - gap2Start + wallThickness, wallThickness));

        // 内部斜向挡板（异形墙壁）
        this.walls.push(new Wall(startX + areaWidth * 0.2, startY + areaHeight * 0.3, areaWidth * 0.25, wallThickness));
        this.walls.push(new Wall(startX + areaWidth * 0.55, startY + areaHeight * 0.5, areaWidth * 0.25, wallThickness));

        // 填充方块
        for (let row = 0; row < rows; row++) {
            const rowColor = randomChoice(CONFIG.NEON_COLORS);
            for (let col = 0; col < cols; col++) {
                const x = startX + col * (brickSize + padding);
                const y = startY + row * (brickSize + padding);

                // 避开内部墙壁位置
                const inWall1 = y >= startY + areaHeight * 0.3 - 2 && y <= startY + areaHeight * 0.3 + wallThickness + 2
                    && x >= startX + areaWidth * 0.2 && x <= startX + areaWidth * 0.45;
                const inWall2 = y >= startY + areaHeight * 0.5 - 2 && y <= startY + areaHeight * 0.5 + wallThickness + 2
                    && x >= startX + areaWidth * 0.55 && x <= startX + areaWidth * 0.8;

                if (!inWall1 && !inWall2) {
                    this.bricks.push(new Brick(x, y, brickSize, rowColor, Math.random() < CONFIG.POWERUP_CHANCE));
                }
            }
        }
    }

    /**
     * 第二关：V形峡谷
     * 两侧是向内倾斜的V形墙壁，底部敞开，方块在V形区域内
     */
    createLevel2(brickSize, padding, canvasWidth) {
        const canvasHeight = this.canvas.height;
        const cols = Math.floor((canvasWidth - 20) / (brickSize + padding));
        const rows = Math.floor((canvasHeight * 0.5) / (brickSize + padding));
        const startX = (canvasWidth - cols * (brickSize + padding)) / 2;
        const startY = CONFIG.BRICK_TOP_OFFSET;

        const wallThickness = 6;
        const areaWidth = cols * (brickSize + padding);
        const areaHeight = rows * (brickSize + padding);

        // 顶部墙 - 两侧，中间留大入口
        const topGapWidth = areaWidth * 0.4;
        const topGapStart = startX + (areaWidth - topGapWidth) / 2;
        this.walls.push(new Wall(startX - wallThickness, startY - wallThickness, topGapStart - startX + wallThickness, wallThickness));
        this.walls.push(new Wall(topGapStart + topGapWidth, startY - wallThickness, startX + areaWidth - topGapStart - topGapWidth + wallThickness, wallThickness));

        // V形左侧墙壁（用多段模拟斜线）
        const segments = 5;
        const segmentHeight = areaHeight / segments;
        const inwardStep = areaWidth * 0.08;

        for (let i = 0; i < segments; i++) {
            const segY = startY + i * segmentHeight;
            const segX = startX - wallThickness + i * inwardStep;
            this.walls.push(new Wall(segX, segY, wallThickness, segmentHeight + 2));
        }

        // V形右侧墙壁
        for (let i = 0; i < segments; i++) {
            const segY = startY + i * segmentHeight;
            const segX = startX + areaWidth - i * inwardStep;
            this.walls.push(new Wall(segX, segY, wallThickness, segmentHeight + 2));
        }

        // 底部完全敞开（无墙）- 小球从下方进入

        // 内部水平障碍
        this.walls.push(new Wall(startX + areaWidth * 0.15, startY + areaHeight * 0.35, areaWidth * 0.3, wallThickness));
        this.walls.push(new Wall(startX + areaWidth * 0.55, startY + areaHeight * 0.55, areaWidth * 0.3, wallThickness));

        // 填充方块（在V形区域内）
        for (let row = 0; row < rows; row++) {
            const rowColor = randomChoice(CONFIG.NEON_COLORS);
            const rowRatio = row / rows;
            const leftBound = startX + rowRatio * inwardStep * segments;
            const rightBound = startX + areaWidth - rowRatio * inwardStep * segments;

            for (let col = 0; col < cols; col++) {
                const x = startX + col * (brickSize + padding);
                const y = startY + row * (brickSize + padding);

                // 只在V形区域内放置方块
                if (x >= leftBound && x + brickSize <= rightBound) {
                    // 避开内部障碍
                    const inWall1 = y >= startY + areaHeight * 0.35 - 2 && y <= startY + areaHeight * 0.35 + wallThickness + 2
                        && x >= startX + areaWidth * 0.15 && x <= startX + areaWidth * 0.45;
                    const inWall2 = y >= startY + areaHeight * 0.55 - 2 && y <= startY + areaHeight * 0.55 + wallThickness + 2
                        && x >= startX + areaWidth * 0.55 && x <= startX + areaWidth * 0.85;

                    if (!inWall1 && !inWall2) {
                        this.bricks.push(new Brick(x, y, brickSize, rowColor, Math.random() < CONFIG.POWERUP_CHANCE));
                    }
                }
            }
        }
    }

    /**
     * 第三关：环形迷宫
     * 中心是空的，方块环绕四周，多个侧面入口
     */
    createLevel3(brickSize, padding, canvasWidth) {
        const canvasHeight = this.canvas.height;
        const cols = Math.floor((canvasWidth - 20) / (brickSize + padding));
        const rows = Math.floor((canvasHeight * 0.55) / (brickSize + padding));
        const startX = (canvasWidth - cols * (brickSize + padding)) / 2;
        const startY = CONFIG.BRICK_TOP_OFFSET;

        const wallThickness = 6;
        const areaWidth = cols * (brickSize + padding);
        const areaHeight = rows * (brickSize + padding);
        const gapWidth = brickSize * 3;

        // 顶部墙 - 中间有入口
        const topGapStart = startX + areaWidth * 0.4;
        this.walls.push(new Wall(startX - wallThickness, startY - wallThickness, topGapStart - startX + wallThickness, wallThickness));
        this.walls.push(new Wall(topGapStart + gapWidth, startY - wallThickness, startX + areaWidth - topGapStart - gapWidth + wallThickness, wallThickness));

        // 左侧墙 - 中间有入口
        const leftGapY = startY + areaHeight * 0.4;
        this.walls.push(new Wall(startX - wallThickness, startY, wallThickness, leftGapY - startY));
        this.walls.push(new Wall(startX - wallThickness, leftGapY + gapWidth, wallThickness, startY + areaHeight - leftGapY - gapWidth));

        // 右侧墙 - 中间有入口
        const rightGapY = startY + areaHeight * 0.5;
        this.walls.push(new Wall(startX + areaWidth, startY, wallThickness, rightGapY - startY));
        this.walls.push(new Wall(startX + areaWidth, rightGapY + gapWidth, wallThickness, startY + areaHeight - rightGapY - gapWidth));

        // 底部墙 - 两侧有入口
        const bottomY = startY + areaHeight;
        this.walls.push(new Wall(startX + gapWidth, bottomY, areaWidth - gapWidth * 2, wallThickness));

        // 中央空心区域的内墙（制造环形）
        const innerStartX = startX + areaWidth * 0.3;
        const innerStartY = startY + areaHeight * 0.3;
        const innerWidth = areaWidth * 0.4;
        const innerHeight = areaHeight * 0.4;

        // 内墙 - 带入口
        this.walls.push(new Wall(innerStartX, innerStartY, innerWidth * 0.4, wallThickness));
        this.walls.push(new Wall(innerStartX + innerWidth * 0.6, innerStartY, innerWidth * 0.4, wallThickness));
        this.walls.push(new Wall(innerStartX, innerStartY + innerHeight, innerWidth, wallThickness));
        this.walls.push(new Wall(innerStartX, innerStartY, wallThickness, innerHeight * 0.4));
        this.walls.push(new Wall(innerStartX, innerStartY + innerHeight * 0.6, wallThickness, innerHeight * 0.4));
        this.walls.push(new Wall(innerStartX + innerWidth, innerStartY, wallThickness, innerHeight + wallThickness));

        // 填充方块（环形区域，避开中心空洞）
        for (let row = 0; row < rows; row++) {
            const rowColor = CONFIG.NEON_COLORS[row % CONFIG.NEON_COLORS.length];
            for (let col = 0; col < cols; col++) {
                const x = startX + col * (brickSize + padding);
                const y = startY + row * (brickSize + padding);

                // 检查是否在中心空洞内
                const inCenter = x >= innerStartX && x <= innerStartX + innerWidth
                    && y >= innerStartY && y <= innerStartY + innerHeight;

                if (!inCenter) {
                    this.bricks.push(new Brick(x, y, brickSize, rowColor, Math.random() < CONFIG.POWERUP_CHANCE));
                }
            }
        }
    }

    onBrickHit(brick) {
        this.score += 10 * this.level;

        // 粒子效果
        const centerX = brick.x + brick.width / 2;
        const centerY = brick.y + brick.height / 2;
        for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
            this.particles.push(new Particle(centerX, centerY, brick.isPowerUp ? CONFIG.POWERUP_COLOR : brick.color));
        }

        // 福利球掉落道具
        if (brick.isPowerUp) {
            const powerUpType = Math.random() < 0.5 ? PowerUpType.SPLIT : PowerUpType.MULTI_BALL;
            this.powerUps.push(new PowerUp(centerX, centerY, powerUpType));
        }

        // 检查胜利
        const remaining = this.bricks.filter(b => b.visible).length;
        if (remaining === 0) {
            this.levelComplete();
        }
    }

    onWallHit(wall) {
        // 墙壁碰撞粒子效果
        for (let i = 0; i < 3; i++) {
            this.particles.push(new Particle(
                wall.x + wall.width / 2,
                wall.y + wall.height / 2,
                CONFIG.WALL_GLOW
            ));
        }
    }

    /**
     * 处理道具效果
     */
    applyPowerUp(powerUp) {
        if (powerUp.type === PowerUpType.SPLIT) {
            // 裂变：每个活跃的球都分裂成3个
            const newBalls = [];
            for (const ball of this.balls) {
                if (ball.active) {
                    newBalls.push(...ball.split());
                }
            }
            this.balls.push(...newBalls);
        } else if (powerUp.type === PowerUpType.MULTI_BALL) {
            // 多球：从挡板发射3个新球
            for (let i = 0; i < 3; i++) {
                const angle = -Math.PI / 2 + (i - 1) * Math.PI / 6;
                const speed = CONFIG.BALL_BASE_SPEED;
                const newBall = new Ball(
                    this.canvas.width, this.canvas.height, this.level,
                    this.paddle.x + this.paddle.width / 2,
                    this.paddle.y - CONFIG.BALL_RADIUS - 5,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                );
                this.balls.push(newBall);
            }
        }
    }

    levelComplete() {
        this.state = GameState.LEVEL_COMPLETE;

        if (this.level >= CONFIG.MAX_LEVEL) {
            this.gameWin();
        } else {
            this.level++;
            setTimeout(() => this.showLevelOverlay(), 500);
        }
    }

    loseLife() {
        this.lives--;

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // 重置一个新球
            this.balls = [new Ball(this.canvas.width, this.canvas.height, this.level)];
            this.paddle.reset(this.canvas.width, this.canvas.height);
            this.powerUps = [];
        }
    }

    gameOver() {
        this.state = GameState.GAME_OVER;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        this.endTitle.textContent = 'GAME OVER';
        this.endTitle.className = 'end-title lose';
        this.endScore.textContent = this.score;
        this.endLevel.textContent = this.level;
        this.endOverlay.classList.remove('hidden');
    }

    gameWin() {
        this.state = GameState.WIN;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        this.endTitle.textContent = 'YOU WIN!';
        this.endTitle.className = 'end-title win';
        this.endScore.textContent = this.score;
        this.endLevel.textContent = this.level;
        this.endOverlay.classList.remove('hidden');
    }

    restartGame() {
        this.endOverlay.classList.add('hidden');
        this.score = 0;
        this.lives = CONFIG.INITIAL_LIVES;
        this.level = 1;
        this.particles = [];
        this.powerUps = [];
        this.showLevelOverlay();
    }

    gameLoop() {
        if (this.state !== GameState.PLAYING) return;

        this.update();
        this.render();

        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // 更新方块（福利球闪烁）
        for (const brick of this.bricks) {
            brick.update();
        }

        // 更新所有球
        let activeBalls = 0;
        for (const ball of this.balls) {
            if (ball.active) {
                ball.update(
                    this.paddle,
                    this.bricks,
                    this.walls,
                    (brick) => this.onBrickHit(brick),
                    (wall) => this.onWallHit(wall)
                );
                if (ball.active) activeBalls++;
            }
        }

        // 所有球都掉落则失去一条命
        if (activeBalls === 0) {
            this.loseLife();
        }

        // 更新道具
        for (const powerUp of this.powerUps) {
            powerUp.update(this.canvas.height);

            // 检测道具与挡板碰撞
            if (powerUp.active && powerUp.checkPaddleCollision(this.paddle)) {
                powerUp.active = false;
                this.applyPowerUp(powerUp);
            }
        }
        this.powerUps = this.powerUps.filter(p => p.active);

        // 更新粒子
        this.particles = this.particles.filter(p => p.update());
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBackground();

        // 绘制墙壁
        for (const wall of this.walls) {
            wall.draw(this.ctx);
        }

        // 绘制方块
        for (const brick of this.bricks) {
            brick.draw(this.ctx);
        }

        // 绘制粒子
        for (const particle of this.particles) {
            particle.draw(this.ctx);
        }

        // 绘制道具
        for (const powerUp of this.powerUps) {
            powerUp.draw(this.ctx);
        }

        // 绘制挡板
        this.paddle.draw(this.ctx);

        // 绘制所有球
        for (const ball of this.balls) {
            ball.draw(this.ctx);
        }

        // 绘制HUD
        this.drawHUD();
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0a0a15');
        gradient.addColorStop(0.5, '#0f0a1a');
        gradient.addColorStop(1, '#0a0a15');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 网格
        this.ctx.strokeStyle = 'rgba(0, 245, 255, 0.03)';
        this.ctx.lineWidth = 1;

        for (let x = 0; x <= this.canvas.width; x += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y <= this.canvas.height; y += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawHUD() {
        this.ctx.save();
        this.ctx.font = 'bold 13px Orbitron, sans-serif';
        this.ctx.textBaseline = 'top';

        // 减弱霓虹效果
        this.ctx.shadowBlur = 2;

        // 分数
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#88ddff';
        this.ctx.shadowColor = '#88ddff';
        this.ctx.fillText(`分数: ${this.score}`, 10, 10);

        // 关卡
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#cc99ff';
        this.ctx.shadowColor = '#cc99ff';
        this.ctx.fillText(`关卡 ${this.level}`, this.canvas.width / 2, 10);

        // 生命
        this.ctx.textAlign = 'right';
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#ff6699';
        let livesText = '';
        for (let i = 0; i < this.lives; i++) livesText += '❤️ ';
        this.ctx.fillText(livesText.trim(), this.canvas.width - 10, 10);

        // 球数量（多球时显示）
        const activeBalls = this.balls.filter(b => b.active).length;
        if (activeBalls > 1) {
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = '#66ff88';
            this.ctx.shadowBlur = 0;
            this.ctx.fillText(`球×${activeBalls}`, 10, 26);
        }

        this.ctx.restore();
    }
}

// ============================================
// 游戏启动
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
