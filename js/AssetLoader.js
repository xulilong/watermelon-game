class AssetLoader {
    constructor() {
        this.images = {};
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.onProgress = null;
        this.onComplete = null;
        this.errors = [];

        // 获取基础路径
        this.basePath = '';

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
            if (!this.images[category]) {
                this.images[category] = {};
            }
            console.log(`开始加载 ${category} 类别的资源...`);
            Object.entries(assets).forEach(([name, path]) => {
                console.log(`准备加载: ${category}/${name} -> ${path}`);
                this.loadImage(category, name, path);
            });
        });
    }

    loadImage(category, name, path) {
        const img = new Image();
        
        img.onload = () => {
            this.images[category][name] = img;
            this.loadedAssets++;

            console.log(`成功加载: ${category}/${name} -> ${path} (${this.loadedAssets}/${this.totalAssets})`);

            // 更新进度
            if (this.onProgress) {
                const progress = (this.loadedAssets / this.totalAssets) * 100;
                this.onProgress(progress);
            }

            // 检查是否所有资源都已加载
            this.checkLoadComplete();
        };

        img.onerror = (error) => {
            console.error(`加载失败: ${category}/${name} -> ${path}`, error);
            console.error('完整URL:', new URL(path, window.location.href).href);
            this.errors.push({
                category,
                name,
                path,
                error: error.message || '未知错误'
            });
            this.loadedAssets++;
            
            // 即使加载失败也要更新进度
            if (this.onProgress) {
                const progress = (this.loadedAssets / this.totalAssets) * 100;
                this.onProgress(progress);
            }

            // 检查是否所有资源都已加载
            this.checkLoadComplete();
        };

        // 添加跨域支持
        img.crossOrigin = 'anonymous';
        
        // 使用绝对路径
        const absolutePath = new URL(path, window.location.href).href;
        console.log(`尝试加载: ${category}/${name} -> ${absolutePath}`);
        img.src = absolutePath;
        
        // 如果图片已经被缓存，可能不会触发 onload
        if (img.complete) {
            console.log(`图片已缓存: ${category}/${name}`);
            img.onload();
        }
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
            
            // 打印加载成功的资源
            console.log('成功加载的资源：');
            Object.entries(this.images).forEach(([category, images]) => {
                console.log(`${category}:`);
                Object.keys(images).forEach(name => {
                    console.log(`  - ${name}`);
                });
            });
            
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