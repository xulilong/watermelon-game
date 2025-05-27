const LeaderboardService = require('../services/leaderboardService');

class LeaderboardController {
    constructor(prisma) {
        this.leaderboardService = new LeaderboardService(prisma);
    }

    submitScore = async (req, res) => {
        try {
            const { nickname, score, level } = req.body;
            const newScore = await this.leaderboardService.createScore({ nickname, score, level });
            res.json(newScore);
        } catch (error) {
            console.error('Error submitting score:', error);
            res.status(500).json({ error: 'Failed to submit score' });
        }
    };

    getLeaderboard = async (req, res) => {
        try {
            const { page, limit } = req.pagination;
            const leaderboard = await this.leaderboardService.getLeaderboard(page, limit);
            res.json(leaderboard);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            res.status(500).json({ error: 'Failed to fetch leaderboard' });
        }
    };
}

module.exports = prisma => new LeaderboardController(prisma); 