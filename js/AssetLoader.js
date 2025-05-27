class AssetLoader {
    constructor() {
        this.images = {};
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.onProgress = null;
        this.onComplete = null;
        this.errors = [];
        this.loadQueue = [];
        this.isLoading = false;

        // 资源优先级配置
        this.priorities = {
            high: ['mouth', 'fruits'],  // 游戏必需的资源
            medium: ['backgrounds'],     // 可以延迟加载的资源
        };

        // 资源路径配置
        this.assets = {
            fruits: {
                watermelon: 'assets/images/fruits/watermelon.png',
                lemon: 'assets/images/fruits/lemon.png',
                apple: 'assets/images/fruits/apple.png',
                grape: 'assets/images/fruits/grape.png',
                orange: 'assets/images/fruits/orange.png',
                banana: 'assets/images/fruits/banana.png',
                kiwi: 'assets/images/fruits/kiwi.png',
                mango: 'assets/images/fruits/mango.png',
                bomb: 'assets/images/fruits/bomb.png'
            },
            backgrounds: {
                picnic: 'assets/images/backgrounds/picnic.jpg',
                garden: 'assets/images/backgrounds/garden.jpg',
                beach: 'assets/images/backgrounds/beach.jpg',
                poolside: 'assets/images/backgrounds/poolside.jpg',
                sunset: 'assets/images/backgrounds/sunset.jpg'
            },
            mouth: {
                base: 'assets/images/mouth/base.png',
                open: 'assets/images/mouth/open.png',
                happy: 'assets/images/mouth/happy.png',
                sad: 'assets/images/mouth/sad.png'
            }
        };

        // 初始化缓存系统
        this.initCache();
    }

    initCache() {
        // 检查是否支持 localStorage
        try {
            this.useCache = typeof localStorage !== 'undefined';
            if (this.useCache) {
                // 清理过期的缓存
                this.cleanCache();
            }
        } catch (e) {
            this.useCache = false;
            console.warn('localStorage不可用，禁用缓存功能');
        }
    }

    cleanCache() {
        const now = Date.now();
        const cacheTimeout = 24 * 60 * 60 * 1000; // 24小时
        
        try {
            const cacheTimestamp = localStorage.getItem('assetsCacheTimestamp');
            if (!cacheTimestamp || now - parseInt(cacheTimestamp) > cacheTimeout) {
                // 清理所有资源缓存
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('asset_')) {
                        localStorage.removeItem(key);
                    }
                });
                localStorage.setItem('assetsCacheTimestamp', now.toString());
            }
        } catch (e) {
            console.warn('清理缓存失败', e);
        }
    }

    load(onProgress, onComplete) {
        this.onProgress = onProgress;
        this.onComplete = onComplete;
        this.errors = [];
        this.loadQueue = [];

        // 计算总资源数
        this.totalAssets = Object.values(this.assets).reduce((total, category) => {
            return total + Object.keys(category).length;
        }, 0);

        console.log(`开始加载 ${this.totalAssets} 个资源...`);

        // 按优先级添加资源到加载队列
        this.priorities.high.forEach(category => {
            if (this.assets[category]) {
                Object.entries(this.assets[category]).forEach(([name, path]) => {
                    this.loadQueue.push({ category, name, path, priority: 'high' });
                });
            }
        });

        this.priorities.medium.forEach(category => {
            if (this.assets[category]) {
                Object.entries(this.assets[category]).forEach(([name, path]) => {
                    this.loadQueue.push({ category, name, path, priority: 'medium' });
                });
            }
        });

        // 开始加载队列
        this.processQueue();
    }

    processQueue() {
        if (this.loadQueue.length === 0) {
            if (this.loadedAssets === this.totalAssets) {
                this.checkLoadComplete();
            }
            return;
        }

        // 同时加载的资源数量
        const maxConcurrent = 4;
        const currentLoading = [];

        // 优先加载高优先级资源
        const highPriorityAssets = this.loadQueue.filter(item => item.priority === 'high');
        const mediumPriorityAssets = this.loadQueue.filter(item => item.priority === 'medium');

        // 先处理高优先级资源
        while (currentLoading.length < maxConcurrent && highPriorityAssets.length > 0) {
            const asset = highPriorityAssets.shift();
            this.loadQueue = this.loadQueue.filter(item => item !== asset);
            currentLoading.push(this.loadImage(asset.category, asset.name, asset.path));
        }

        // 如果还有空余的并发槽，处理中优先级资源
        while (currentLoading.length < maxConcurrent && mediumPriorityAssets.length > 0) {
            const asset = mediumPriorityAssets.shift();
            this.loadQueue = this.loadQueue.filter(item => item !== asset);
            currentLoading.push(this.loadImage(asset.category, asset.name, asset.path));
        }

        // 等待当前批次的资源加载完成
        Promise.all(currentLoading).then(() => {
            // 继续处理队列中的其他资源
            this.processQueue();
        });
    }

    loadImage(category, name, path) {
        return new Promise((resolve) => {
            if (!this.images[category]) {
                this.images[category] = {};
            }

            const img = new Image();
            
            img.onload = () => {
                this.images[category][name] = img;
                this.loadedAssets++;

                console.log(`成功加载: ${category}/${name} (${this.loadedAssets}/${this.totalAssets})`);

                if (this.onProgress) {
                    const progress = (this.loadedAssets / this.totalAssets) * 100;
                    this.onProgress(progress);
                }

                resolve();
            };

            img.onerror = (error) => {
                console.error(`加载失败: ${category}/${name}`, error);
                this.errors.push({
                    category,
                    name,
                    path,
                    error: error.message || '未知错误'
                });
                this.loadedAssets++;
                
                if (this.onProgress) {
                    const progress = (this.loadedAssets / this.totalAssets) * 100;
                    this.onProgress(progress);
                }

                resolve();
            };

            // 添加跨域支持
            img.crossOrigin = 'anonymous';
            
            // 使用绝对路径
            const absolutePath = new URL(path, window.location.href).href;
            img.src = absolutePath;
            
            // 如果图片已经被缓存，可能不会触发 onload
            if (img.complete) {
                img.onload();
            }
        });
    }

    checkLoadComplete() {
        if (this.loadedAssets === this.totalAssets) {
            console.log('所有资源加载完成！');
            if (this.errors.length > 0) {
                console.error('资源加载完成，但有以下错误：');
                this.errors.forEach(error => {
                    console.error(`- ${error.category}/${error.name}: ${error.error}`);
                });
            }
            
            if (this.onComplete) {
                this.onComplete();
            }
        }
    }

    getImage(category, name) {
        const image = this.images[category]?.[name];
        if (!image) {
            console.warn(`未找到图片: ${category}/${name}`);
            return null;
        }
        return image;
    }
} 