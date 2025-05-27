class AssetLoader {
    constructor() {
        this.images = {};
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.onProgress = null;
        this.onComplete = null;
        this.errors = [];

        // 获取基础路径
        this.basePath = './';

        // 资源路径配置
        this.assets = {
            fruits: {
                watermelon: this.basePath + 'assets/images/fruits/watermelon.png',
                lemon: this.basePath + 'assets/images/fruits/lemon.png',
                apple: this.basePath + 'assets/images/fruits/apple.png',
                grape: this.basePath + 'assets/images/fruits/grape.png',
                orange: this.basePath + 'assets/images/fruits/orange.png',
                banana: this.basePath + 'assets/images/fruits/banana.png',
                kiwi: this.basePath + 'assets/images/fruits/kiwi.png',
                mango: this.basePath + 'assets/images/fruits/mango.png',
                bomb: this.basePath + 'assets/images/fruits/bomb.png'
            },
            backgrounds: {
                picnic: this.basePath + 'assets/images/backgrounds/picnic.jpg',
                garden: this.basePath + 'assets/images/backgrounds/garden.jpg',
                beach: this.basePath + 'assets/images/backgrounds/beach.jpg',
                poolside: this.basePath + 'assets/images/backgrounds/poolside.jpg',
                sunset: this.basePath + 'assets/images/backgrounds/sunset.jpg'
            },
            mouth: {
                base: this.basePath + 'assets/images/mouth/base.png',
                open: this.basePath + 'assets/images/mouth/open.png',
                happy: this.basePath + 'assets/images/mouth/happy.png',
                sad: this.basePath + 'assets/images/mouth/sad.png'
            }
        };
    }

    load(onProgress, onComplete) {
        this.onProgress = onProgress;
        this.onComplete = onComplete;
        this.errors = [];

        // 计算总资源数
        this.totalAssets = Object.values(this.assets).reduce((total, category) => {
            return total + Object.keys(category).length;
        }, 0);

        console.log(`开始加载 ${this.totalAssets} 个资源...`);

        // 加载所有资源
        Object.entries(this.assets).forEach(([category, assets]) => {
            Object.entries(assets).forEach(([name, path]) => {
                this.loadImage(category, name, path);
            });
        });
    }

    loadImage(category, name, path) {
        const img = new Image();
        
        img.onload = () => {
            if (!this.images[category]) {
                this.images[category] = {};
            }
            this.images[category][name] = img;
            this.loadedAssets++;

            console.log(`成功加载: ${path} (${this.loadedAssets}/${this.totalAssets})`);

            // 更新进度
            if (this.onProgress) {
                const progress = (this.loadedAssets / this.totalAssets) * 100;
                this.onProgress(progress);
            }

            // 检查是否所有资源都已加载
            if (this.loadedAssets === this.totalAssets) {
                if (this.errors.length > 0) {
                    console.error('资源加载完成，但有以下错误：');
                    this.errors.forEach(error => console.error(error));
                }
                if (this.onComplete) {
                    this.onComplete();
                }
            }
        };

        img.onerror = (error) => {
            console.error(`加载失败: ${path}`, error);
            this.errors.push(`Failed to load ${path}`);
            this.loadedAssets++;
            
            // 即使加载失败也要更新进度
            if (this.onProgress) {
                const progress = (this.loadedAssets / this.totalAssets) * 100;
                this.onProgress(progress);
            }

            // 检查是否所有资源都已加载
            if (this.loadedAssets === this.totalAssets) {
                if (this.errors.length > 0) {
                    console.error('资源加载完成，但有以下错误：');
                    this.errors.forEach(error => console.error(error));
                }
                if (this.onComplete) {
                    this.onComplete();
                }
            }
        };

        // 添加跨域支持
        img.crossOrigin = 'anonymous';
        img.src = path;
        
        // 如果图片已经被缓存，可能不会触发 onload
        if (img.complete) {
            img.onload();
        }
    }

    getImage(category, name) {
        return this.images[category]?.[name];
    }
} 