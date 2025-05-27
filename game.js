// 游戏配置
const CONFIG = {
    FPS: 60,
    MOUTH_INITIAL_SIZE: 40,
    MOUTH_MIN_SIZE: 20,
    MOUTH_MAX_SIZE: 80,
    MOUTH_SPEED: 5,
    FRUIT_SIZE: 30,
    FRUIT_SPAWN_INTERVAL: 3000,  // 第一关更慢的生成间隔
    BOMB_SPAWN_INTERVAL: 6000,   // 第一关更慢的炸弹生成
    LEVEL_TIME: 45,
    SCORE_PER_FRUIT: 5,
    WATERMELON_GROWTH: 8,
    LEMON_SHRINK: 4,
    OBSTACLE_WIDTH: 100,
    OBSTACLE_HEIGHT: 20,
    SCORE_MULTIPLIER_BASE: 1.5,
    COMBO_DURATION: 3000,
    COMBO_MULTIPLIER: 0.05,
    MAX_COMBO: 8,
    SCREEN_SHAKE_DURATION: 500,
    SCREEN_SHAKE_INTENSITY: 5,
    BACKGROUND_TRANSITION_DURATION: 1000,
    BACKGROUND_PARTICLE_COUNT: 50,
    BACKGROUND_PARTICLE_SIZE: 3,
    BACKGROUND_PARTICLE_SPEED: 1,
};

// 游戏状态
const GAME_STATE = {
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    LEVEL_COMPLETE: 'levelComplete'
};

// 水果类型
const FRUIT_TYPES = {
    WATERMELON: { color: '#ff6b6b', score: 8, effect: 'grow' },
    MANGO: { color: '#ffbe76', score: 7, effect: 'color' },
    BANANA: { color: '#ffd700', score: 6, effect: 'color' },
    APPLE: { color: '#ff4757', score: 5, effect: 'color' },
    GRAPE: { color: '#8c7ae6', score: 4, effect: 'color' },
    KIWI: { color: '#7bed9f', score: 3, effect: 'color' },
    ORANGE: { color: '#ffa502', score: 3, effect: 'color' },
    LEMON: { color: '#ffd93d', score: -5, effect: 'shrink' },
    BOMB: { color: '#2f3542', score: 0, effect: 'explode' }
};

class Game {
    constructor() {
        // 不在构造函数中初始化
        console.log('Game 类实例化...');
    }

    init() {
        console.log('开始初始化游戏...');
        // 获取canvas元素
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('找不到canvas元素！');
            return;
        }

        // 获取canvas上下文
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('无法获取canvas上下文！');
            return;
        }

        console.log('Canvas 初始化成功！');
        this.setupCanvas();
        
        // 游戏状态
        this.state = GAME_STATE.LOADING;
        this.level = 1;
        this.score = 0;
        this.timeLeft = CONFIG.LEVEL_TIME;
        
        // 游戏对象
        this.mouth = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            size: CONFIG.MOUTH_INITIAL_SIZE,
            color: '#ffffff',
            angle: 0,
            openness: 0.5,
            expression: 'base'
        };
        
        this.fruits = [];
        this.particles = [];
        
        // 增强背景系统
        this.backgrounds = [
            { name: 'picnic', theme: 'summer', particleColor: '#ffffff', description: '阳光明媚的野餐日' },
            { name: 'garden', theme: 'nature', particleColor: '#90EE90', description: '果园里的西瓜成熟了' },
            { name: 'beach', theme: 'warm', particleColor: '#ffd700', description: '沙滩上的清凉时光' },
            { name: 'poolside', theme: 'cool', particleColor: '#87CEEB', description: '泳池边的休闲时刻' },
            { name: 'sunset', theme: 'warm', particleColor: '#FDB813', description: '夕阳下的甜蜜滋味' }
        ];
        
        this.backgroundIndex = 0;
        this.previousBackgroundIndex = 0;
        this.backgroundTransition = {
            active: false,
            progress: 0,
            startTime: 0
        };
        
        // 背景粒子
        this.backgroundParticles = this.initBackgroundParticles();
        
        // 控制
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        
        // 添加障碍物数组
        this.obstacles = [];
        
        // 添加积分倍数
        this.scoreMultiplier = 1;
        
        // 添加连击系统
        this.combo = 0;
        this.lastFruitTime = 0;
        this.comboTimer = null;
        
        // 添加屏幕震动效果
        this.screenShake = {
            active: false,
            duration: 0,
            intensity: 0,
            startTime: 0
        };
        
        // 添加特效粒子
        this.effects = [];
        
        // 添加提示文本
        this.notifications = [];
        
        // 触摸控制相关
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isTouching = false;
        
        // 初始化
        this.setupEventListeners();
        
        // 加载资源
        this.assetLoader = new AssetLoader();
        this.assetLoader.load(
            (progress) => {
                // 更新加载进度
                const progressBar = document.getElementById('loadingProgress');
                const loadingText = document.getElementById('loadingText');
                if (progressBar && loadingText) {
                    progressBar.style.width = `${progress}%`;
                    loadingText.textContent = `${Math.floor(progress)}%`;
                }
            },
            () => {
                // 资源加载完成
                const loadingScreen = document.getElementById('loadingScreen');
                if (loadingScreen) {
                    loadingScreen.classList.add('hidden');
                }
                this.state = GAME_STATE.MENU;
                this.initUI();
                
                // 开始游戏循环
                this.lastTime = 0;
                this.fruitSpawnTimer = 0;
                this.bombSpawnTimer = 0;
                this.animate = this.animate.bind(this);
                requestAnimationFrame(this.animate);
            }
        );
    }

    setupCanvas() {
        console.log('设置Canvas尺寸...');
        
        // 获取设备像素比
        const dpr = window.devicePixelRatio || 1;
        
        // 获取容器尺寸
        const container = document.querySelector('.game-container');
        if (!container) {
            console.error('找不到game-container元素！');
            return;
        }
        
        // 获取容器的实际尺寸
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // 检测是否为移动设备和屏幕方向
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        const isLandscape = window.matchMedia("(orientation: landscape)").matches;
        
        let gameWidth, gameHeight;
        
        if (isMobile) {
            if (isLandscape) {
                // 移动端横屏：保持16:9的宽高比
                const targetAspectRatio = 16 / 9;
                const containerAspectRatio = containerWidth / containerHeight;
                
                if (containerAspectRatio > targetAspectRatio) {
                    // 容器更宽，以高度为基准
                    gameHeight = containerHeight;
                    gameWidth = gameHeight * targetAspectRatio;
                } else {
                    // 容器更高，以宽度为基准
                    gameWidth = containerWidth;
                    gameHeight = gameWidth / targetAspectRatio;
                }
            } else {
                // 移动端竖屏：保持9:16的宽高比
                const targetAspectRatio = 9 / 16;
                const containerAspectRatio = containerWidth / containerHeight;
                
                if (containerAspectRatio > targetAspectRatio) {
                    // 容器更宽，以高度为基准
                    gameHeight = containerHeight;
                    gameWidth = gameHeight * targetAspectRatio;
                } else {
                    // 容器更高，以宽度为基准
                    gameWidth = containerWidth;
                    gameHeight = gameWidth / targetAspectRatio;
                }
            }
        } else {
            // PC端：使用容器完整尺寸
            gameWidth = containerWidth;
            gameHeight = containerHeight;
        }
        
        // 设置canvas的实际尺寸（考虑设备像素比）
        this.canvas.width = gameWidth * dpr;
        this.canvas.height = gameHeight * dpr;
        
        // 设置canvas的CSS尺寸
        this.canvas.style.width = `${gameWidth}px`;
        this.canvas.style.height = `${gameHeight}px`;
        
        // 居中canvas
        this.canvas.style.left = `${(containerWidth - gameWidth) / 2}px`;
        this.canvas.style.top = `${(containerHeight - gameHeight) / 2}px`;
        
        // 调整绘图上下文的缩放
        this.ctx.scale(dpr, dpr);
        
        // 保存游戏区域的实际尺寸
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        
        // 重新定位嘴巴
        if (this.mouth) {
            if (isMobile) {
                if (isLandscape) {
                    // 横屏：放在底部中间偏上
                    this.mouth.x = gameWidth / 2;
                    this.mouth.y = gameHeight * 0.75;
                } else {
                    // 竖屏：放在底部中间偏上一些
                    this.mouth.x = gameWidth / 2;
                    this.mouth.y = gameHeight * 0.65; // 改为65%的位置，更容易操作
                }
            } else {
                // PC端：保持在底部中间
                this.mouth.x = gameWidth / 2;
                this.mouth.y = gameHeight * 0.85;
            }
            
            // 确保嘴巴在游戏区域内
            this.mouth.x = Math.min(Math.max(this.mouth.x, this.mouth.size), gameWidth - this.mouth.size);
            this.mouth.y = Math.min(Math.max(this.mouth.y, this.mouth.size), gameHeight - this.mouth.size);
        }
        
        // 调整游戏参数以适应不同屏幕尺寸
        this.adjustGameParameters();
        
        console.log(`Canvas尺寸设置完成: ${gameWidth} x ${gameHeight}, DPR: ${dpr}, Mobile: ${isMobile}, Landscape: ${isLandscape}`);
    }

    adjustGameParameters() {
        // 根据屏幕尺寸调整游戏参数
        const screenRatio = Math.min(this.gameWidth, this.gameHeight) / 1000; // 使用1000作为基准尺寸
        
        // 调整嘴巴大小
        CONFIG.MOUTH_INITIAL_SIZE = Math.round(40 * screenRatio);
        CONFIG.MOUTH_MIN_SIZE = Math.round(20 * screenRatio);
        CONFIG.MOUTH_MAX_SIZE = Math.round(80 * screenRatio);
        CONFIG.MOUTH_SPEED = Math.round(5 * screenRatio);
        
        // 调整水果大小
        CONFIG.FRUIT_SIZE = Math.round(30 * screenRatio);
        
        // 调整障碍物尺寸
        CONFIG.OBSTACLE_WIDTH = Math.round(100 * screenRatio);
        CONFIG.OBSTACLE_HEIGHT = Math.round(20 * screenRatio);
        
        // 调整特效参数
        CONFIG.SCREEN_SHAKE_INTENSITY = Math.round(5 * screenRatio);
        CONFIG.BACKGROUND_PARTICLE_SIZE = Math.round(3 * screenRatio);
        
        console.log('游戏参数已根据屏幕尺寸调整');
    }

    setupEventListeners() {
        // 键盘事件监听
        window.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        window.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });

        // 触摸事件监听
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            this.isTouching = true;
            
            // 计算触摸点相对于canvas的位置
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.gameWidth / rect.width;
            const scaleY = this.gameHeight / rect.height;
            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;
            
            // 移动到触摸位置，但保持在游戏区域内
            this.mouth.x = Math.min(Math.max(x, this.mouth.size), this.gameWidth - this.mouth.size);
            this.mouth.y = Math.min(Math.max(y, this.mouth.size), this.gameHeight - this.mouth.size);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isTouching) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.gameWidth / rect.width;
                const scaleY = this.gameHeight / rect.height;
                const x = (touch.clientX - rect.left) * scaleX;
                const y = (touch.clientY - rect.top) * scaleY;
                
                // 限制移动范围
                this.mouth.x = Math.min(Math.max(x, this.mouth.size), this.gameWidth - this.mouth.size);
                this.mouth.y = Math.min(Math.max(y, this.mouth.size), this.gameHeight - this.mouth.size);
                
                // 计算移动角度
                const dx = touch.clientX - this.touchStartX;
                const dy = touch.clientY - this.touchStartY;
                if (dx !== 0 || dy !== 0) {
                    this.mouth.angle = Math.atan2(dy, dx);
                }
            }
        });

        this.canvas.addEventListener('touchend', () => {
            this.isTouching = false;
        });

        this.canvas.addEventListener('touchcancel', () => {
            this.isTouching = false;
        });

        // 窗口大小改变事件
        window.addEventListener('resize', () => {
            this.setupCanvas();
        });

        // 暂停按钮点击事件
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.togglePause();
            });
        }

        // 游戏说明按钮点击事件
        const instructionBtn = document.getElementById('instructionBtn');
        const instructionPopup = document.getElementById('instructionPopup');
        if (instructionBtn && instructionPopup) {
            instructionBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                instructionPopup.classList.toggle('hidden');
            });

            // 点击其他地方关闭说明
            document.addEventListener('click', (e) => {
                if (!instructionPopup.classList.contains('hidden') && 
                    !instructionBtn.contains(e.target) && 
                    !instructionPopup.contains(e.target)) {
                    instructionPopup.classList.add('hidden');
                }
            });
        }

        // UI按钮事件
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('nextLevelBtn').addEventListener('click', () => this.nextLevel());
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartLevelBtn').addEventListener('click', () => this.restartLevel());
        document.getElementById('quitBtn').addEventListener('click', () => this.quitGame());
    }

    initUI() {
        // 初始化UI元素
        document.getElementById('level').textContent = this.level;
        document.getElementById('score').textContent = this.score;
        document.getElementById('timer').textContent = this.timeLeft;
        
        // 设置关卡信息
        document.getElementById('levelNumber').textContent = this.level;
        document.getElementById('targetScore').textContent = this.getTargetScore();
        document.getElementById('timeLimit').textContent = CONFIG.LEVEL_TIME;
        
        // 更新关卡提示
        this.updateLevelTips();
        
        // 显示开始界面
        this.showOverlay(GAME_STATE.MENU);
    }

    animate(currentTime) {
        requestAnimationFrame(this.animate);

        // 计算帧间隔
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (this.state === GAME_STATE.PLAYING) {
            this.update(deltaTime);
        }

        this.render();
    }

    update(deltaTime) {
        // 更新时间
        if (this.timeLeft > 0) {
            this.timeLeft -= deltaTime / 1000;
            document.getElementById('timer').textContent = Math.ceil(this.timeLeft);
            
            if (this.timeLeft <= 0) {
                this.checkLevelComplete();
                return;
            }
        }

        // 更新嘴巴位置
        this.updateMouth();

        // 生成水果
        this.fruitSpawnTimer += deltaTime;
        this.bombSpawnTimer += deltaTime;
        
        if (this.fruitSpawnTimer >= CONFIG.FRUIT_SPAWN_INTERVAL) {
            this.spawnFruit();
            this.fruitSpawnTimer = 0;
        }
        
        if (this.bombSpawnTimer >= CONFIG.BOMB_SPAWN_INTERVAL) {
            this.spawnBomb();
            this.bombSpawnTimer = 0;
        }

        // 更新水果位置
        this.updateFruits(deltaTime);

        // 更新粒子效果
        this.updateParticles(deltaTime);

        // 更新障碍物
        this.updateObstacles(deltaTime);
        
        // 更新特效
        this.updateEffects(deltaTime);
        
        // 更新提示文本
        this.updateNotifications(deltaTime);
        
        // 更新屏幕震动
        this.updateScreenShake(deltaTime);

        // 更新背景
        this.updateBackgroundParticles(deltaTime);
        
        // 更新背景过渡
        if (this.backgroundTransition.active) {
            const elapsed = Date.now() - this.backgroundTransition.startTime;
            this.backgroundTransition.progress = Math.min(elapsed / CONFIG.BACKGROUND_TRANSITION_DURATION, 1);
            
            if (this.backgroundTransition.progress >= 1) {
                this.backgroundTransition.active = false;
            }
        }

        // 检查碰撞
        this.checkCollisions();
    }

    updateMouth() {
        const oldX = this.mouth.x;
        const oldY = this.mouth.y;
        
        // 如果不是触摸控制，则使用键盘控制
        if (!this.isTouching) {
            if (this.keys.left) this.mouth.x = Math.max(this.mouth.size, this.mouth.x - CONFIG.MOUTH_SPEED);
            if (this.keys.right) this.mouth.x = Math.min(this.gameWidth - this.mouth.size, this.mouth.x + CONFIG.MOUTH_SPEED);
            if (this.keys.up) this.mouth.y = Math.max(this.mouth.size, this.mouth.y - CONFIG.MOUTH_SPEED);
            if (this.keys.down) this.mouth.y = Math.min(this.gameHeight - this.mouth.size, this.mouth.y + CONFIG.MOUTH_SPEED);

            // 更新键盘控制的角度
            this.mouth.angle = Math.atan2(
                this.keys.up ? -1 : this.keys.down ? 1 : 0,
                this.keys.left ? -1 : this.keys.right ? 1 : 0
            );
        }

        // 检查与障碍物的碰撞
        if (this.checkObstacleCollision()) {
            // 如果发生碰撞，恢复原位置
            this.mouth.x = oldX;
            this.mouth.y = oldY;
        }
        
        // 限制嘴巴在游戏区域内
        this.mouth.x = Math.min(Math.max(this.mouth.x, this.mouth.size), this.gameWidth - this.mouth.size);
        this.mouth.y = Math.min(Math.max(this.mouth.y, this.mouth.size), this.gameHeight - this.mouth.size);
        
        // 张嘴动画
        this.mouth.openness = 0.5 + Math.sin(Date.now() / 200) * 0.2;

        // 更新积分倍数
        const sizeRatio = (this.mouth.size - CONFIG.MOUTH_MIN_SIZE) / 
                         (CONFIG.MOUTH_MAX_SIZE - CONFIG.MOUTH_MIN_SIZE);
        this.scoreMultiplier = 1 + sizeRatio * (CONFIG.SCORE_MULTIPLIER_BASE - 1);
    }

    checkObstacleCollision() {
        for (const obstacle of this.obstacles) {
            // 检查嘴巴是否与障碍物相交
            const mouthLeft = this.mouth.x - this.mouth.size;
            const mouthRight = this.mouth.x + this.mouth.size;
            const mouthTop = this.mouth.y - this.mouth.size;
            const mouthBottom = this.mouth.y + this.mouth.size;

            if (mouthRight > obstacle.x && 
                mouthLeft < obstacle.x + obstacle.width &&
                mouthBottom > obstacle.y && 
                mouthTop < obstacle.y + obstacle.height) {
                return true;
            }
        }
        return false;
    }

    spawnFruit() {
        // 根据权重随机选择水果类型
        const fruitWeights = {
            'WATERMELON': 30,  // 西瓜占30%的概率
            'MANGO': 10,      // 其他水果平均分配剩余70%
            'BANANA': 10,
            'APPLE': 10,
            'GRAPE': 10,
            'KIWI': 10,
            'ORANGE': 10,
            'LEMON': 10       // 柠檬保持与其他普通水果相同概率
        };
        
        // 计算总权重
        const totalWeight = Object.values(fruitWeights).reduce((a, b) => a + b, 0);
        
        // 随机选择
        let random = Math.random() * totalWeight;
        let selectedFruit = null;
        
        for (const [fruit, weight] of Object.entries(fruitWeights)) {
            random -= weight;
            if (random <= 0) {
                selectedFruit = fruit;
                break;
            }
        }
        
        // 如果没有选中任何水果（理论上不会发生），默认为西瓜
        if (!selectedFruit) {
            selectedFruit = 'WATERMELON';
        }

        // 计算安全的生成范围
        const fruitSize = CONFIG.FRUIT_SIZE;
        const padding = fruitSize * 2; // 添加一些边距，防止水果太靠边
        const minX = padding;
        const maxX = this.gameWidth - padding;

        // 创建水果对象，确保在可视区域内生成
        const fruit = {
            x: Math.random() * (maxX - minX) + minX,
            y: -fruitSize,
            type: selectedFruit,
            ...FRUIT_TYPES[selectedFruit],
            speedY: 0, // 初始下落速度
            speedX: 0, // 可能的横向移动速度
            rotation: Math.random() * Math.PI * 2 // 随机初始旋转角度
        };

        // 添加到水果数组
        this.fruits.push(fruit);
        
        // 调试日志
        console.log(`Spawned ${selectedFruit} at x:${fruit.x.toFixed(2)}, gameWidth:${this.gameWidth}`);
    }

    spawnBomb() {
        // 计算安全的生成范围
        const bombSize = CONFIG.FRUIT_SIZE;
        const padding = bombSize * 2;
        const minX = padding;
        const maxX = this.gameWidth - padding;

        const bomb = {
            x: Math.random() * (maxX - minX) + minX,
            y: -bombSize,
            type: 'BOMB',
            ...FRUIT_TYPES.BOMB,
            speedY: 0,
            speedX: 0,
            rotation: Math.random() * Math.PI * 2
        };
        this.fruits.push(bomb);
    }

    updateFruits(deltaTime) {
        // 检测是否为移动设备
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        
        // 基础速度随关卡提升，但起始值更低，移动端额外降低30%
        const baseSpeed = (0.8 + this.level * 0.2) * (deltaTime / 16) * (isMobile ? 0.7 : 1); 
        // 重力效果更小，移动端额外降低30%
        const gravity = (0.02 + this.level * 0.005) * (deltaTime / 16) * (isMobile ? 0.7 : 1);
        
        this.fruits = this.fruits.filter(fruit => {
            // 更新速度，根据关卡调整最大下落速度，移动端额外降低30%
            const maxSpeed = (3 + this.level * 0.3) * (isMobile ? 0.7 : 1);
            fruit.speedY = Math.min(fruit.speedY + gravity, maxSpeed);
            
            // 更新位置
            fruit.y += (fruit.speedY + baseSpeed);
            fruit.x += fruit.speedX * (deltaTime / 16);
            
            // 更新旋转，使旋转速度更平滑，并随关卡增加
            fruit.rotation += (0.005 + this.level * 0.001) * (deltaTime / 16);
            
            // 边界检查
            if (fruit.x < CONFIG.FRUIT_SIZE) {
                fruit.x = CONFIG.FRUIT_SIZE;
                fruit.speedX *= -0.3; // 减小反弹力度
            } else if (fruit.x > this.gameWidth - CONFIG.FRUIT_SIZE) {
                fruit.x = this.gameWidth - CONFIG.FRUIT_SIZE;
                fruit.speedX *= -0.3;
            }
            
            return fruit.y < this.gameHeight + CONFIG.FRUIT_SIZE * 2;
        });
    }

    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // 重力
            particle.life -= deltaTime;
            return particle.life > 0;
        });
    }

    updateObstacles(deltaTime) {
        this.obstacles.forEach(obstacle => {
            if (obstacle.type === 'moving') {
                obstacle.x = obstacle.originalX + Math.sin(Date.now() / 1000) * obstacle.range;
            }
        });
    }

    updateEffects(deltaTime) {
        this.effects = this.effects.filter(effect => {
            effect.life -= deltaTime;
            effect.y -= effect.speed;
            effect.opacity = effect.life / effect.maxLife;
            return effect.life > 0;
        });
    }

    updateNotifications(deltaTime) {
        this.notifications = this.notifications.filter(notification => {
            notification.life -= deltaTime;
            
            // 根据类型设置不同的动画效果
            switch (notification.type) {
                case 'score':
                    // 向上飘动并放大后缩小
                    notification.y -= 1;
                    notification.scale = 1 + Math.sin(notification.life / notification.maxLife * Math.PI) * 0.5;
                    break;
                case 'combo':
                    // 弹跳效果
                    notification.scale = 1 + Math.sin(notification.life / notification.maxLife * Math.PI * 2) * 0.3;
                    break;
                case 'status':
                    // 左右摇摆
                    notification.rotation = Math.sin(notification.life / 100) * 0.1;
                    break;
                case 'level':
                    // 淡入淡出
                    notification.opacity = notification.life / notification.maxLife;
                    break;
                default:
                    // 默认向上飘动
                    notification.y -= 0.5;
                    notification.scale = 1 + (notification.life / notification.maxLife) * 0.2;
            }

            return notification.life > 0;
        });
    }

    updateScreenShake(deltaTime) {
        if (this.screenShake.active) {
            const elapsed = Date.now() - this.screenShake.startTime;
            if (elapsed >= this.screenShake.duration) {
                this.screenShake.active = false;
            }
        }
    }

    checkCollisions() {
        this.fruits = this.fruits.filter(fruit => {
            const dx = fruit.x - this.mouth.x;
            const dy = fruit.y - this.mouth.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.mouth.size + CONFIG.FRUIT_SIZE) {
                this.handleCollision(fruit);
                return false;
            }
            return true;
        });
    }

    handleCollision(fruit) {
        if (fruit.type === 'BOMB') {
            this.mouth.expression = 'sad';
            this.gameOver();
            this.createExplosion(fruit.x, fruit.y);
            this.startScreenShake(CONFIG.SCREEN_SHAKE_DURATION, CONFIG.SCREEN_SHAKE_INTENSITY);
            return;
        }

        // 更新连击系统
        const now = Date.now();
        if (now - this.lastFruitTime < CONFIG.COMBO_DURATION) {
            this.combo = Math.min(this.combo + 1, CONFIG.MAX_COMBO);
        } else {
            this.combo = 1;
        }
        this.lastFruitTime = now;

        // 清除之前的连击计时器
        if (this.comboTimer) clearTimeout(this.comboTimer);
        
        // 设置新的连击计时器
        this.comboTimer = setTimeout(() => {
            if (this.combo > 1) {
                this.showNotification(`连击结束！`, 1000);
                this.combo = 0;
            }
        }, CONFIG.COMBO_DURATION);

        // 计算得分
        if (fruit.type === 'LEMON') {
            // 柠檬直接减5分，不受任何倍数影响
            this.score = Math.max(0, this.score - Math.abs(fruit.score));
            document.getElementById('score').textContent = this.score;
            // 显示减分信息
            this.showNotification(`-${Math.abs(fruit.score)}`, 1000, 'score');
        } else {
            // 其他水果正常计算倍数
            const sizeMultiplier = this.scoreMultiplier;
            const comboMultiplier = 1 + (this.combo - 1) * CONFIG.COMBO_MULTIPLIER;
            const totalMultiplier = sizeMultiplier * comboMultiplier;

            // 更新分数
            const baseScore = fruit.score;
            const multipliedScore = Math.round(baseScore * totalMultiplier);
            this.score += multipliedScore;
            document.getElementById('score').textContent = this.score;

            // 显示得分信息
            this.showNotification(`+${multipliedScore}`, 1000, 'score');
            
            // 显示连击信息
            if (this.combo > 1) {
                this.showNotification(`${this.combo}连击！x${comboMultiplier.toFixed(1)}`, 1000, 'combo');
            }
        }

        // 应用效果
        switch (fruit.effect) {
            case 'grow':
                if (this.checkSizeChange(this.mouth.size + CONFIG.WATERMELON_GROWTH)) {
                    this.mouth.size = Math.min(CONFIG.MOUTH_MAX_SIZE, this.mouth.size + CONFIG.WATERMELON_GROWTH);
                    this.mouth.expression = 'happy';
                    this.showNotification(`变大！积分 x${this.scoreMultiplier.toFixed(1)}`, 1500, 'status');
                    this.startScreenShake(CONFIG.SCREEN_SHAKE_DURATION / 2, CONFIG.SCREEN_SHAKE_INTENSITY / 2);
                } else {
                    this.score += baseScore;
                    document.getElementById('score').textContent = this.score;
                    this.showNotification('无法变大！获得额外积分', 1500, 'status');
                }
                break;
            case 'shrink':
                this.mouth.size = Math.max(CONFIG.MOUTH_MIN_SIZE, this.mouth.size - CONFIG.LEMON_SHRINK);
                this.mouth.expression = 'open';
                this.showNotification(`变小！积分 x${this.scoreMultiplier.toFixed(1)}`, 1500, 'status');
                break;
            case 'color':
                this.mouth.color = fruit.color;
                this.mouth.expression = 'happy';
                break;
        }

        // 创建更炫酷的特效
        this.createEnhancedEffects(fruit);

        // 一段时间后恢复正常表情
        setTimeout(() => {
            this.mouth.expression = 'base';
        }, 500);
    }

    checkSizeChange(newSize) {
        const tempSize = this.mouth.size;
        this.mouth.size = newSize;
        
        // 检查新尺寸是否会导致卡在障碍物中
        const collision = this.checkObstacleCollision();
        this.mouth.size = tempSize;
        
        return !collision;
    }

    createEnhancedEffects(fruit) {
        // 基础粒子效果
        const particleCount = Math.abs(fruit.score) * 2; // 根据分数决定粒子数量
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 2 + Math.abs(fruit.score) / 4; // 分数越高，粒子速度越快
            this.particles.push({
                x: fruit.x,
                y: fruit.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: fruit.color,
                life: 1000 + Math.abs(fruit.score) * 100 // 分数越高，持续时间越长
            });
        }
        
        // 创建光环效果
        const ringCount = Math.max(6, Math.abs(fruit.score)); // 分数越高，光环越多
        for (let i = 0; i < ringCount; i++) {
            const angle = (Math.PI * 2 * i) / ringCount;
            const distance = 30 + Math.abs(fruit.score) * 2; // 分数越高，光环越大
            this.effects.push({
                x: fruit.x + Math.cos(angle) * distance,
                y: fruit.y + Math.sin(angle) * distance,
                size: 10 + Math.abs(fruit.score), // 分数越高，光环越大
                color: fruit.score < 0 ? '#ff4757' : fruit.color, // 负分显示红色
                speed: 2 + Math.abs(fruit.score) / 4,
                life: 1000 + Math.abs(fruit.score) * 100,
                maxLife: 1000 + Math.abs(fruit.score) * 100,
                opacity: 1
            });
        }
        
        // 创建星星效果
        if (fruit.score >= 6) { // 只有高分水果才有星星效果
            const starCount = Math.floor(fruit.score / 2);
            for (let i = 0; i < starCount; i++) {
                const angle = (Math.PI * 2 * i) / starCount;
                const distance = 40;
                this.effects.push({
                    x: fruit.x + Math.cos(angle) * distance,
                    y: fruit.y + Math.sin(angle) * distance,
                    size: 15,
                    color: '#ffffff',
                    speed: 3,
                    life: 800,
                    maxLife: 800,
                    opacity: 1,
                    rotation: angle
                });
            }
        }

        // 特殊效果：柠檬的负分效果
        if (fruit.score < 0) {
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 * i) / 12;
                this.effects.push({
                    x: fruit.x,
                    y: fruit.y,
                    size: 20,
                    color: '#ff4757',
                    speed: 4,
                    life: 600,
                    maxLife: 600,
                    opacity: 1,
                    rotation: angle
                });
            }
        }
    }

    createScorePopup(x, y, score) {
        const text = {
            x: x,
            y: y,
            score: score,
            life: 1000,
            opacity: 1
        };
        this.particles.push(text);
    }

    createParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                color: color,
                life: 1000
            });
        }
    }

    createExplosion(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 5 + Math.random() * 5;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: '#ff4757',
                life: 1500
            });
        }
    }

    render() {
        // 应用屏幕震动
        this.ctx.save();
        if (this.screenShake.active) {
            const elapsed = Date.now() - this.screenShake.startTime;
            const progress = elapsed / this.screenShake.duration;
            const intensity = this.screenShake.intensity * (1 - progress);
            const dx = (Math.random() - 0.5) * intensity;
            const dy = (Math.random() - 0.5) * intensity;
            this.ctx.translate(dx, dy);
        }

        // 清空画布
        this.ctx.fillStyle = '#1e272e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制背景
        if (this.backgroundTransition.active) {
            // 绘制前一个背景
            const prevImage = this.assetLoader.getImage('backgrounds', this.backgrounds[this.previousBackgroundIndex].name);
            if (prevImage) {
                this.ctx.globalAlpha = 1 - this.backgroundTransition.progress;
                this.ctx.drawImage(prevImage, 0, 0, this.canvas.width, this.canvas.height);
            }
            
            // 绘制当前背景
            const currentImage = this.assetLoader.getImage('backgrounds', this.backgrounds[this.backgroundIndex].name);
            if (currentImage) {
                this.ctx.globalAlpha = this.backgroundTransition.progress;
                this.ctx.drawImage(currentImage, 0, 0, this.canvas.width, this.canvas.height);
            }
            
            this.ctx.globalAlpha = 1;
        } else {
            const backgroundImage = this.assetLoader.getImage('backgrounds', this.backgrounds[this.backgroundIndex].name);
            if (backgroundImage) {
                this.ctx.drawImage(backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
            }
        }
        
        // 绘制背景粒子
        const currentBackground = this.backgrounds[this.backgroundIndex];
        this.backgroundParticles.forEach(particle => {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `${currentBackground.particleColor}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`;
            this.ctx.fill();
        });

        // 绘制特效
        this.effects.forEach(effect => {
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `${effect.color}${Math.floor(effect.opacity * 255).toString(16).padStart(2, '0')}`;
            this.ctx.fill();
        });

        // 绘制水果
        this.fruits.forEach(fruit => this.drawFruit(fruit));

        // 绘制粒子
        this.particles.forEach(particle => this.drawParticle(particle));

        // 绘制障碍物
        this.obstacles.forEach(obstacle => {
            // 绘制发光效果
            const gradient = this.ctx.createLinearGradient(
                obstacle.x, obstacle.y,
                obstacle.x, obstacle.y + obstacle.height
            );
            gradient.addColorStop(0, 'rgba(255, 107, 107, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 71, 87, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 107, 107, 0.8)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // 添加纹理和发光边框
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // 如果是移动障碍物，添加特殊标记
            if (obstacle.type === 'moving') {
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x + 10, obstacle.y + obstacle.height/2);
                this.ctx.lineTo(obstacle.x + obstacle.width - 10, obstacle.y + obstacle.height/2);
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        });

        // 绘制嘴巴
        this.drawMouth();

        // 绘制提示文本
        this.notifications.forEach(notification => {
            this.ctx.save();
            this.ctx.translate(notification.x, notification.y);
            this.ctx.rotate(notification.rotation || 0);
            this.ctx.scale(notification.scale, notification.scale);
            
            // 文字阴影效果
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 5;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;

            this.ctx.font = `bold ${notification.fontSize}px Arial`;
            this.ctx.fillStyle = notification.color + Math.floor(notification.opacity * 255).toString(16).padStart(2, '0');
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(notification.text, 0, 0);
            
            this.ctx.restore();
        });

        // 绘制连击信息
        if (this.combo > 1) {
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillStyle = '#ffd700';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`${this.combo}连击！`, this.canvas.width - 20, 90);
        }

        // 绘制游戏状态面板
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.roundRect(10, 10, 600, 40, 5);
        this.ctx.fill();

        // 设置文字样式
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;

        let currentX = 20;
        const padding = 20;

        // 绘制关卡
        this.ctx.fillStyle = '#ffffff';
        const levelText = `关卡 ${this.level}`;
        this.ctx.fillText(levelText, currentX, 38);
        currentX += this.ctx.measureText(levelText).width + padding;

        // 绘制目标分数
        this.ctx.fillStyle = '#ffd700';
        const targetText = `目标 ${this.getTargetScore()}`;
        this.ctx.fillText(targetText, currentX, 38);
        currentX += this.ctx.measureText(targetText).width + padding;

        // 绘制当前分数
        this.ctx.fillStyle = '#4facfe';
        const scoreText = `得分 ${this.score}`;
        this.ctx.fillText(scoreText, currentX, 38);
        currentX += this.ctx.measureText(scoreText).width + padding;

        // 绘制剩余时间
        this.ctx.fillStyle = '#ff6b6b';
        const timeText = `时间 ${Math.ceil(this.timeLeft)}`;
        this.ctx.fillText(timeText, currentX, 38);

        // 重置阴影
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        this.ctx.restore();
    }

    drawFruit(fruit) {
        const image = this.assetLoader.getImage('fruits', fruit.type.toLowerCase());
        if (image) {
            this.ctx.save();
            this.ctx.translate(fruit.x, fruit.y);
            this.ctx.rotate(fruit.rotation || 0);
            this.ctx.drawImage(
                image,
                -CONFIG.FRUIT_SIZE,
                -CONFIG.FRUIT_SIZE,
                CONFIG.FRUIT_SIZE * 2,
                CONFIG.FRUIT_SIZE * 2
            );
            this.ctx.restore();
        }
    }

    drawParticle(particle) {
        if (particle.score !== undefined) {
            // 绘制分数提示
            this.ctx.font = '20px Arial';
            this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`+${particle.score}`, particle.x, particle.y);
            particle.y -= 1;
            particle.opacity = particle.life / 1000;
        } else {
            // 绘制普通粒子
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / 1000;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
    }

    drawMouth() {
        this.ctx.save();
        this.ctx.translate(this.mouth.x, this.mouth.y);
        this.ctx.rotate(this.mouth.angle);

        // 绘制嘴巴
        const mouthImage = this.assetLoader.getImage('mouth', this.mouth.expression);
        if (mouthImage) {
            const size = this.mouth.size * 2;
            this.ctx.drawImage(
                mouthImage,
                -size/2,
                -size/2,
                size,
                size
            );
        }

        this.ctx.restore();
    }

    startGame() {
        this.state = GAME_STATE.PLAYING;
        this.hideOverlays();
        this.resetLevel();
        this.initLevel();
    }

    resetLevel() {
        this.timeLeft = CONFIG.LEVEL_TIME;
        this.fruits = [];
        this.particles = [];
        this.mouth.size = CONFIG.MOUTH_INITIAL_SIZE;
        this.mouth.color = '#ffffff';
        this.fruitSpawnTimer = 0;
        this.bombSpawnTimer = 0;
    }

    togglePause() {
        if (this.state === GAME_STATE.PLAYING) {
            this.state = GAME_STATE.PAUSED;
            this.showOverlay(GAME_STATE.PAUSED);
        } else if (this.state === GAME_STATE.PAUSED) {
            this.resumeGame();
        }
    }

    resumeGame() {
        this.state = GAME_STATE.PLAYING;
        this.hideOverlays();
    }

    gameOver() {
        this.state = GAME_STATE.GAME_OVER;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.level;
        this.showOverlay(GAME_STATE.GAME_OVER);
    }

    checkLevelComplete() {
        const targetScore = this.getTargetScore();
        const timeBonus = Math.ceil(this.timeLeft * 10); // 先计算时间奖励
        const finalScore = this.score + timeBonus; // 加上时间奖励后的最终分数
        
        if (finalScore >= targetScore) {
            this.state = GAME_STATE.LEVEL_COMPLETE;
            document.getElementById('levelScore').textContent = this.score;
            document.getElementById('levelTime').textContent = Math.ceil(CONFIG.LEVEL_TIME - this.timeLeft);
            document.getElementById('timeBonus').textContent = timeBonus;
            this.score = finalScore; // 更新总分
            this.showOverlay(GAME_STATE.LEVEL_COMPLETE);
        } else {
            this.gameOver();
        }
    }

    nextLevel() {
        this.level++;
        
        // 更新背景
        this.previousBackgroundIndex = this.backgroundIndex;
        this.backgroundIndex = (this.backgroundIndex + 1) % this.backgrounds.length;
        this.backgroundTransition = {
            active: true,
            progress: 0,
            startTime: Date.now()
        };
        
        document.getElementById('level').textContent = this.level;
        document.getElementById('levelNumber').textContent = this.level;
        document.getElementById('targetScore').textContent = this.getTargetScore();
        
        // 更新关卡提示
        this.updateLevelTips();
        
        this.state = GAME_STATE.PLAYING;
        this.hideOverlays();
        this.resetLevel();
        this.initLevel();
    }

    restartGame() {
        this.level = 1;
        this.score = 0;
        document.getElementById('level').textContent = this.level;
        document.getElementById('score').textContent = this.score;
        this.startGame();
    }

    restartLevel() {
        this.score = Math.max(0, this.score - this.getTargetScore()); // 扣除当前关卡所需分数
        document.getElementById('score').textContent = this.score;
        this.state = GAME_STATE.PLAYING;
        this.hideOverlays();
        this.resetLevel();
    }

    quitGame() {
        this.state = GAME_STATE.MENU;
        this.level = 1;
        this.score = 0;
        this.initUI();
    }

    getTargetScore() {
        // 基础分析：
        // 1. 水果分数：西瓜8分，芒果7分，香蕉6分，苹果5分，葡萄4分，猕猴桃/橙子3分，柠檬-5分
        // 2. 每45秒约可以吃到30个水果（每1.5秒一个）
        // 3. 考虑到障碍物和难度，实际可吃到的比例递减
        // 4. 连击和尺寸增益作为额外加分，不计入基本目标

        // 第一关：入门难度
        if (this.level === 1) {
            return 60; // 基础目标分数
        }

        // 基础分数（第一关）
        const baseScore = 60;
        
        // 指数增长系数（可以根据需要调整）
        const growthRate = 1.4;
        
        // 计算目标分数
        // 使用指数函数：baseScore * (growthRate ^ (level-1))
        // 这样每一关的目标分数都是前一关的 growthRate 倍
        const targetScore = Math.floor(baseScore * Math.pow(growthRate, this.level - 1));
        
        // 为了避免分数增长过快，在高等级时稍微降低增长率
        if (this.level > 8) {
            // 从第9关开始，增长率逐渐降低
            const reductionFactor = Math.max(0.7, 1 - (this.level - 8) * 0.05);
            return Math.floor(targetScore * reductionFactor);
        }
        
        return targetScore;
    }

    showOverlay(state) {
        const overlays = {
            [GAME_STATE.MENU]: 'levelStart',
            [GAME_STATE.PAUSED]: 'pauseMenu',
            [GAME_STATE.GAME_OVER]: 'gameOver',
            [GAME_STATE.LEVEL_COMPLETE]: 'levelComplete'
        };

        Object.values(overlays).forEach(id => {
            const element = document.getElementById(id);
            element.classList.toggle('hidden', id !== overlays[state]);
        });
    }

    hideOverlays() {
        ['levelStart', 'pauseMenu', 'gameOver', 'levelComplete'].forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });
    }

    initLevel() {
        // 根据关卡生成障碍物
        this.obstacles = [];
        
        // 检测是否为移动设备
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        
        // 第一关没有障碍物，纯粹练习基本操作
        if (this.level === 1) {
            // 第一关特殊设置，移动端生成间隔更长
            CONFIG.FRUIT_SPAWN_INTERVAL = isMobile ? 4000 : 3000;  // 移动端4秒一个水果
            CONFIG.BOMB_SPAWN_INTERVAL = isMobile ? 8000 : 6000;   // 移动端8秒一个炸弹
            return;
        }
        
        // 第2-4关：静态障碍物，数量逐渐增加
        if (this.level <= 4) {
            const obstacleCount = Math.floor((this.level - 1) / 2);  // 2关1个，3关1个，4关2个
            for (let i = 0; i < obstacleCount; i++) {
                const obstacle = {
                    x: Math.random() * (this.canvas.width - CONFIG.OBSTACLE_WIDTH),
                    y: this.canvas.height * (0.3 + Math.random() * 0.4),
                    width: CONFIG.OBSTACLE_WIDTH,
                    height: CONFIG.OBSTACLE_HEIGHT,
                    type: 'static',
                    speed: 0,
                    originalX: 0,
                    range: 0
                };
                this.obstacles.push(obstacle);
            }
            
            // 逐步加快生成速度，移动端更慢
            const speedMultiplier = isMobile ? 0.7 : 1;
            CONFIG.FRUIT_SPAWN_INTERVAL = Math.max(3000 - (this.level - 1) * 200, 1500) / speedMultiplier;
            CONFIG.BOMB_SPAWN_INTERVAL = Math.max(6000 - (this.level - 1) * 300, 3000) / speedMultiplier;
            return;
        }
        
        // 第5关开始引入移动障碍物
        const obstacleCount = Math.min(2 + Math.floor((this.level - 4) / 2), 6);
        const movingObstacleRatio = Math.min(0.2 + (this.level - 5) * 0.1, 0.6);
        
        for (let i = 0; i < obstacleCount; i++) {
            const type = Math.random() < movingObstacleRatio ? 'moving' : 'static';
            const speedMultiplier = isMobile ? 0.7 : 1; // 移动端障碍物速度降低30%
            const obstacle = {
                x: Math.random() * (this.canvas.width - CONFIG.OBSTACLE_WIDTH),
                y: this.canvas.height * (0.3 + Math.random() * 0.4),
                width: CONFIG.OBSTACLE_WIDTH,
                height: CONFIG.OBSTACLE_HEIGHT,
                type: type,
                speed: type === 'moving' ? (Math.random() - 0.5) * (2 + (this.level - 5) * 0.3) * speedMultiplier : 0,
                originalX: 0,
                range: type === 'moving' ? (150 + (this.level - 5) * 15) * speedMultiplier : 0
            };
            obstacle.originalX = obstacle.x;
            this.obstacles.push(obstacle);
        }
        
        // 调整水果生成间隔，移动端更慢
        const speedMultiplier = isMobile ? 0.7 : 1;
        CONFIG.FRUIT_SPAWN_INTERVAL = Math.max(1500 - (this.level - 5) * 30, 800) / speedMultiplier;
        CONFIG.BOMB_SPAWN_INTERVAL = Math.max(3000 - (this.level - 5) * 50, 2000) / speedMultiplier;
    }

    showNotification(text, duration, type = 'normal') {
        // 根据类型确定位置和样式
        let x, y, fontSize, color;
        switch (type) {
            case 'score':
                // 分数提示从吃到的水果位置向上飘
                x = this.mouth.x;
                y = this.mouth.y - 30;
                fontSize = 24;
                color = '#ffd700'; // 金色
                break;
            case 'combo':
                // 连击提示显示在右上角
                x = this.canvas.width - 100;
                y = 120;
                fontSize = 28;
                color = '#ff6b6b'; // 红色
                break;
            case 'status':
                // 状态变化提示（变大变小等）显示在左上角
                x = 150;
                y = 120;
                fontSize = 24;
                color = '#4facfe'; // 蓝色
                break;
            case 'level':
                // 关卡信息显示在屏幕中央
                x = this.canvas.width / 2;
                y = this.canvas.height / 2 - 50 + this.notifications.filter(n => n.type === 'level').length * 40;
                fontSize = 32;
                color = '#ffffff';
                break;
            default:
                // 默认提示显示在屏幕中央偏上
                x = this.canvas.width / 2;
                y = this.canvas.height / 3;
                fontSize = 24;
                color = '#ffffff';
        }

        this.notifications.push({
            text,
            x,
            y,
            type,
            fontSize,
            color,
            life: duration,
            maxLife: duration,
            opacity: 1,
            scale: 1.5, // 初始大小
            rotation: (Math.random() - 0.5) * 0.2 // 随机小角度
        });
    }

    startScreenShake(duration, intensity) {
        this.screenShake = {
            active: true,
            duration: duration,
            intensity: intensity,
            startTime: Date.now()
        };
    }

    updateLevelTips() {
        const tipsList = document.getElementById('levelTips');
        tipsList.innerHTML = '';  // 清空现有提示
        
        const tips = [];
        
        // 基础提示
        tips.push('触摸屏幕任意位置控制移动');
        tips.push('吃到西瓜会变大，柠檬会变小');
        tips.push('连续吃到水果可以触发连击加分');
        
        // 根据关卡添加特定提示
        if (this.level === 1) {
            tips.push('这是教学关卡，尽情练习基本操作吧');
            tips.push('目标分数很低，慢慢来不要着急');
        } else if (this.level <= 4) {
            tips.push(`本关有${this.level - 1}个静态障碍物`);
            tips.push('注意避开障碍物，别被卡住了');
        } else {
            const movingCount = Math.floor(this.obstacles.filter(o => o.type === 'moving').length);
            tips.push(`本关有${movingCount}个移动的障碍物`);
            tips.push('移动障碍物的速度和范围都增加了');
            tips.push('水果和炸弹生成速度加快，要更加专注');
        }
        
        // 添加提示到HTML
        tips.forEach(tip => {
            const li = document.createElement('li');
            li.textContent = tip;
            tipsList.appendChild(li);
        });
    }

    initBackgroundParticles() {
        const particles = [];
        for (let i = 0; i < CONFIG.BACKGROUND_PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * CONFIG.BACKGROUND_PARTICLE_SIZE + 1,
                speedX: (Math.random() - 0.5) * CONFIG.BACKGROUND_PARTICLE_SPEED,
                speedY: (Math.random() - 0.5) * CONFIG.BACKGROUND_PARTICLE_SPEED,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
        return particles;
    }
    
    updateBackgroundParticles(deltaTime) {
        this.backgroundParticles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            // 边界检查
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            // 根据关卡和主题调整粒子行为
            const theme = this.backgrounds[this.backgroundIndex].theme;
            switch (theme) {
                case 'bright':
                    particle.opacity = 0.3 + Math.sin(Date.now() / 1000 + particle.x) * 0.2;
                    break;
                case 'warm':
                    particle.size = CONFIG.BACKGROUND_PARTICLE_SIZE * (1 + Math.sin(Date.now() / 1500) * 0.3);
                    break;
                case 'cool':
                    particle.speedY = Math.sin(Date.now() / 2000 + particle.x) * CONFIG.BACKGROUND_PARTICLE_SPEED;
                    break;
                case 'nature':
                    particle.speedX = Math.cos(Date.now() / 2000 + particle.y) * CONFIG.BACKGROUND_PARTICLE_SPEED;
                    break;
                case 'dark':
                    particle.opacity = 0.2 + Math.sin(Date.now() / 800 + particle.x + particle.y) * 0.3;
                    break;
            }
        });
    }

    handleKeyDown(e) {
        switch(e.key) {
            case 'ArrowLeft': this.keys.left = true; break;
            case 'ArrowRight': this.keys.right = true; break;
            case 'ArrowUp': this.keys.up = true; break;
            case 'ArrowDown': this.keys.down = true; break;
            case 'Escape': this.togglePause(); break;
        }
    }

    handleKeyUp(e) {
        switch(e.key) {
            case 'ArrowLeft': this.keys.left = false; break;
            case 'ArrowRight': this.keys.right = false; break;
            case 'ArrowUp': this.keys.up = false; break;
            case 'ArrowDown': this.keys.down = false; break;
        }
    }
}

// 修改初始化代码
window.addEventListener('load', () => {
    console.log('页面完全加载完成，等待DOM准备...');
    
    // 确保DOM完全准备好
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeGame);
    } else {
        initializeGame();
    }
});

function initializeGame() {
    console.log('DOM准备完成，开始初始化游戏...');
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('无法找到canvas元素，请检查HTML文件！');
        return;
    }
    console.log('找到canvas元素，创建游戏实例...');
    const game = new Game();
    game.init();
} 