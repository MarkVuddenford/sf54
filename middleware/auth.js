// Middleware для проверки авторизации
const requireAuth = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Middleware для проверки прав администратора
const requireAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).send('Доступ запрещен');
    }
};

// Middleware для проверки прав модератора
const requireModerator = (req, res, next) => {
    if (req.session.user && (req.session.user.role === 'moderator' || req.session.user.role === 'admin')) {
        next();
    } else {
        res.status(403).send('Доступ запрещен');
    }
};

// Middleware для проверки бана
const checkBan = async (req, res, next) => {
    if (!req.session.user) {
        return next();
    }

    try {
        const [users] = await pool.query(
            'SELECT is_banned, ban_expires, ban_reason FROM users WHERE id = ?',
            [req.session.user.id]
        );

        if (users.length > 0 && users[0].is_banned && new Date(users[0].ban_expires) > new Date()) {
            return res.status(403).json({
                success: false,
                error: 'Вы забанены',
                banExpires: users[0].ban_expires,
                banReason: users[0].ban_reason
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

// Middleware для проверки мута
const checkMute = async (req, res, next) => {
    if (!req.session.user) {
        return next();
    }

    try {
        const [users] = await pool.query(
            'SELECT is_muted, mute_expires FROM users WHERE id = ?',
            [req.session.user.id]
        );

        if (users.length > 0 && users[0].is_muted && new Date(users[0].mute_expires) > new Date()) {
            return res.status(403).json({
                success: false,
                error: 'Вы находитесь в муте',
                muteExpires: users[0].mute_expires
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    requireAuth,
    requireAdmin,
    requireModerator,
    checkBan,
    checkMute
}; 