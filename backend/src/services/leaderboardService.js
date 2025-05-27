class LeaderboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }

    async createScore(data) {
        try {
            return await this.prisma.score.create({
                data: {
                    nickname: data.nickname,
                    score: data.score,
                    level: data.level
                }
            });
        } catch (error) {
            throw new Error('Failed to create score: ' + error.message);
        }
    }

    async getLeaderboard(page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const [scores, total] = await Promise.all([
                this.prisma.score.findMany({
                    orderBy: {
                        score: 'desc'
                    },
                    take: limit,
                    skip: skip,
                    select: {
                        nickname: true,
                        score: true,
                        level: true,
                        createdAt: true
                    }
                }),
                this.prisma.score.count()
            ]);

            return {
                data: scores,
                pagination: {
                    total,
                    page,
                    pageSize: limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw new Error('Failed to fetch leaderboard: ' + error.message);
        }
    }
}

module.exports = LeaderboardService; 