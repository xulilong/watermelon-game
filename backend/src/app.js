require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 路由
app.use('/api', require('./routes/leaderboard')(prisma));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing HTTP server and Prisma client...');
  prisma.$disconnect();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 