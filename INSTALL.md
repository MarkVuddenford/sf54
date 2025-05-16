# Установка SCP Foundation Forum

## Требования
- Node.js (версия 14 или выше)
- MySQL (версия 5.7 или выше)
- npm или yarn

## Шаги установки

1. Клонируйте репозиторий:
```bash
git clone https://github.com/your-username/scp-forum.git
cd scp-forum
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env` в корневой директории проекта со следующим содержимым:
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=scp_forum
SESSION_SECRET=your-secret-key
```

4. Создайте базу данных и таблицы:
```bash
mysql -u root -p < database.sql
```

5. Запустите сервер:
```bash
npm start
```

## Предустановленный аккаунт администратора
- Логин: WorldPlugin
- Пароль: mailmail123

## Структура проекта
```
scp-forum/
├── config/
│   └── database.js
├── middleware/
│   └── auth.js
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   └── images/
├── routes/
│   └── api.js
├── views/
│   ├── index.ejs
│   ├── login.ejs
│   ├── register.ejs
│   ├── profile.ejs
│   └── admin.ejs
├── .env
├── database.sql
├── INSTALL.md
├── package.json
└── server.js
```

## Функциональность
- Регистрация и авторизация пользователей
- Создание и управление темами
- Система рангов пользователей
- Система модерации и администрации
- Система банов и мутов
- Личные сообщения
- Друзья
- Редактирование и удаление сообщений
- Закрытие и блокировка тем

## Безопасность
- Все пароли хешируются с использованием bcrypt
- Сессии защищены
- Защита от SQL-инъекций
- Проверка прав доступа
- Защита от XSS-атак

## Поддержка
Если у вас возникли проблемы или вопросы, создайте issue в репозитории проекта. 