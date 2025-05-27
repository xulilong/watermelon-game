const express = require('express');
const router = express.Router();
const { validateScore, validatePagination } = require('../middlewares/validator');

module.exports = (prisma) => {
    const leaderboardController = require('../controllers/leaderboardController')(prisma);

    // 提交分数
    router.post('/scores', validateScore, leaderboardController.submitScore);

    // 获取排行榜
    router.get('/leaderboard', validatePagination, leaderboardController.getLeaderboard);

    return router;
}; 