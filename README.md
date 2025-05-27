# 吃个大西瓜

一个有趣的 HTML5 游戏，通过控制角色吃掉掉落的水果来获得分数。游戏支持键盘和触摸控制，适合各种设备。

## 在线演示

你可以在这里玩游戏：[吃个大西瓜](https://xulilong.github.io/watermelon-game)

## 游戏特点

- 多种水果，不同分数
- 连击加成系统
- 关卡进阶
- 炫酷特效
- 支持键盘和触摸控制
- 响应式设计，支持各种设备

## 游戏规则

- 🍉 西瓜: 8分
- 🥭 芒果: 7分
- 🍌 香蕉: 6分
- 🍎 苹果: 5分
- 🍇 葡萄: 4分
- 🥝 猕猴桃: 3分
- 🍊 橙子: 3分
- 🍋 柠檬: -5分
- 💣 炸弹: 游戏结束

## 本地运行

```bash
# 克隆仓库
git clone https://github.com/xulilong/watermelon-game.git
cd watermelon-game

# 安装依赖
npm install

# 启动服务器
npx http-server -c-1
```

然后在浏览器中访问 `http://localhost:8080`

## 部署

本游戏使用 GitHub Pages 部署。如果你想部署自己的版本：

1. Fork 这个仓库
2. 进入仓库设置 Settings > Pages
3. 选择 Source 为 `gh-pages` 分支
4. 保存后等待几分钟，你的游戏就会在 `https://你的用户名.github.io/watermelon-game` 上线

## 技术栈

- HTML5 Canvas
- JavaScript (ES6+)
- CSS3

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License 