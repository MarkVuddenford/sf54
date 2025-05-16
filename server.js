const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const moment = require('moment');
require('dotenv').config();

// Настройка EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'scp-foundation-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Подключение к базе данных
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'scp_forum'
});

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

// Маршруты
app.get('/', (req, res) => {
    res.render('index', { user: req.session.user });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/profile/:id', requireAuth, async (req, res) => {
    try {
        const [user] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (user.length === 0) {
            return res.status(404).send('Пользователь не найден');
        }
        res.render('profile', { profileUser: user[0], user: req.session.user });
    } catch (error) {
        res.status(500).send('Ошибка сервера');
    }
});

app.get('/admin', requireAdmin, (req, res) => {
    res.render('admin', { user: req.session.user });
});

// API маршруты
app.post('/api/register', async (req, res) => {
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

app.post('/api/login', async (req, res) => {
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

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
}); 