const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Регистрация
router.post('/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await pool.query(
            'INSERT INTO users (username, password, email, role, join_date) VALUES (?, ?, ?, ?, NOW())',
            [username, hashedPassword, email, 'user']
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка при регистрации' });
    }
});

// Вход
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        
        if (users.length === 0) {
            return res.status(401).json({ success: false, error: 'Неверные учетные данные' });
        }
        
        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ success: false, error: 'Неверные учетные данные' });
        }
        
        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role
        };
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка при входе' });
    }
});

// Проверка мута
router.get('/check-mute', requireAuth, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT is_muted, mute_expires FROM users WHERE id = ?',
            [req.session.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }
        
        const user = users[0];
        const isMuted = user.is_muted && new Date(user.mute_expires) > new Date();
        
        res.json({
            success: true,
            isMuted,
            muteExpires: user.mute_expires
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка при проверке мута' });
    }
});

// Проверка бана
router.get('/check-ban', requireAuth, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT is_banned, ban_expires, ban_reason FROM users WHERE id = ?',
            [req.session.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }
        
        const user = users[0];
        const isBanned = user.is_banned && new Date(user.ban_expires) > new Date();
        
        res.json({
            success: true,
            isBanned,
            banExpires: user.ban_expires,
            banReason: user.ban_reason
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка при проверке бана' });
    }
});

// Создание темы
router.post('/topics', requireAuth, async (req, res) => {
    try {
        const { title, content, isLocked } = req.body;
        
        const [result] = await pool.query(
            'INSERT INTO topics (title, content, author_id, created_at, is_locked) VALUES (?, ?, ?, NOW(), ?)',
            [title, content, req.session.user.id, isLocked]
        );
        
        res.json({ success: true, topicId: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка при создании темы' });
    }
});

// Создание сообщения
router.post('/posts', requireAuth, async (req, res) => {
    try {
        const { content, topicId } = req.body;
        
        // Проверка мута
        const [users] = await pool.query(
            'SELECT is_muted, mute_expires FROM users WHERE id = ?',
            [req.session.user.id]
        );
        
        if (users[0].is_muted && new Date(users[0].mute_expires) > new Date()) {
            return res.status(403).json({
                success: false,
                error: `Вы находитесь в муте до ${new Date(users[0].mute_expires).toLocaleString()}`
            });
        }
        
        // Проверка блокировки темы
        const [topics] = await pool.query(
            'SELECT is_locked FROM topics WHERE id = ?',
            [topicId]
        );
        
        if (topics[0].is_locked) {
            return res.status(403).json({
                success: false,
                error: 'Эта тема заблокирована'
            });
        }
        
        const [result] = await pool.query(
            'INSERT INTO posts (topic_id, author_id, content, created_at) VALUES (?, ?, ?, NOW())',
            [topicId, req.session.user.id, content]
        );
        
        res.json({ success: true, postId: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка при создании сообщения' });
    }
});

// Редактирование сообщения
router.put('/posts/:id', requireAuth, async (req, res) => {
    try {
        const { content } = req.body;
        const postId = req.params.id;
        
        // Проверка прав на редактирование
        const [posts] = await pool.query(
            'SELECT author_id FROM posts WHERE id = ?',
            [postId]
        );
        
        if (posts.length === 0) {
            return res.status(404).json({ success: false, error: 'Сообщение не найдено' });
        }
        
        if (posts[0].author_id !== req.session.user.id && req.session.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Нет прав на редактирование' });
        }
        
        await pool.query(
            'UPDATE posts SET content = ?, is_edited = TRUE, edited_at = NOW() WHERE id = ?',
            [content, postId]
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка при редактировании сообщения' });
    }
});

// Удаление сообщения
router.delete('/posts/:id', requireAuth, async (req, res) => {
    try {
        const postId = req.params.id;
        
        // Проверка прав на удаление
        const [posts] = await pool.query(
            'SELECT author_id FROM posts WHERE id = ?',
            [postId]
        );
        
        if (posts.length === 0) {
            return res.status(404).json({ success: false, error: 'Сообщение не найдено' });
        }
        
        if (posts[0].author_id !== req.session.user.id && req.session.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Нет прав на удаление' });
        }
        
        await pool.query('DELETE FROM posts WHERE id = ?', [postId]);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка при удалении сообщения' });
    }
});

// Закрытие темы
router.post('/topics/:id/close', requireAuth, async (req, res) => {
    try {
        const topicId = req.params.id;
        
        // Проверка прав на закрытие
        const [topics] = await pool.query(
            'SELECT author_id FROM topics WHERE id = ?',
            [topicId]
        );
        
        if (topics.length === 0) {
            return res.status(404).json({ success: false, error: 'Тема не найдена' });
        }
        
        if (topics[0].author_id !== req.session.user.id && req.session.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Нет прав на закрытие темы' });
        }
        
        await pool.query(
            'UPDATE topics SET is_closed = TRUE WHERE id = ?',
            [topicId]
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка при закрытии темы' });
    }
});

// Блокировка темы
router.post('/topics/:id/lock', requireAuth, async (req, res) => {
    try {
        const topicId = req.params.id;
        
        // Проверка прав на блокировку
        const [topics] = await pool.query(
            'SELECT author_id FROM topics WHERE id = ?',
            [topicId]
        );
        
        if (topics.length === 0) {
            return res.status(404).json({ success: false, error: 'Тема не найдена' });
        }
        
        if (topics[0].author_id !== req.session.user.id && req.session.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Нет прав на блокировку темы' });
        }
        
        await pool.query(
            'UPDATE topics SET is_locked = TRUE WHERE id = ?',
            [topicId]
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка при блокировке темы' });
    }
});

// API для администратора
router.get('/admin/users', requireAdmin, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, username, role, join_date, is_banned, is_muted FROM users');
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка при получении списка пользователей' });
    }
});

router.post('/admin/mute', requireAdmin, async (req, res) => {
    try {
        const { userId, duration } = req.body;
        const muteExpires = new Date(Date.now() + duration * 60000);
        
        await pool.query(
            'UPDATE users SET is_muted = TRUE, mute_expires = ? WHERE id = ?',
            [muteExpires, userId]
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка при муте пользователя' });
    }
});

router.post('/admin/ban', requireAdmin, async (req, res) => {
    try {
        const { userId, duration, reason } = req.body;
        const banExpires = new Date(Date.now() + duration * 24 * 60 * 60000);
        
        await pool.query(
            'UPDATE users SET is_banned = TRUE, ban_expires = ?, ban_reason = ? WHERE id = ?',
            [banExpires, reason, userId]
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка при бане пользователя' });
    }
});

module.exports = router; 