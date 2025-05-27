const validateScore = (req, res, next) => {
    const { nickname, score, level } = req.body;
    
    if (!nickname || typeof nickname !== 'string' || nickname.length > 50) {
        return res.status(400).json({ 
            error: 'Invalid nickname. Must be a string with maximum length of 50 characters.' 
        });
    }

    if (!Number.isInteger(score)) {
        return res.status(400).json({ 
            error: 'Invalid score. Must be an integer.' 
        });
    }

    if (!Number.isInteger(level) || level < 1) {
        return res.status(400).json({ 
            error: 'Invalid level. Must be a positive integer.' 
        });
    }

    next();
};

const validatePagination = (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({ 
            error: 'Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 100.' 
        });
    }

    req.pagination = { page, limit };
    next();
};

module.exports = {
    validateScore,
    validatePagination
}; 