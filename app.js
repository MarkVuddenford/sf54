// Элементы DOM
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const userSection = document.getElementById('userSection');
const authButtons = document.getElementById('authButtons');
const topicsList = document.getElementById('topicsList');

// Обработчики модальных окон
loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
});

registerBtn.addEventListener('click', () => {
    registerModal.style.display = 'block';
});

// Закрытие модальных окон
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        loginModal.style.display = 'none';
        registerModal.style.display = 'none';
    });
});

// Обработка входа
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        loginModal.style.display = 'none';
        updateUI(userCredential.user);
    } catch (error) {
        alert('Ошибка входа: ' + error.message);
    }
});

// Обработка регистрации
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        // Создание профиля пользователя в Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            username: username,
            email: email,
            role: 'user',
            joinDate: firebase.firestore.FieldValue.serverTimestamp(),
            forumTime: 0,
            rank: 'Новичок'
        });
        registerModal.style.display = 'none';
        updateUI(userCredential.user);
    } catch (error) {
        alert('Ошибка регистрации: ' + error.message);
    }
});

// Обновление UI при изменении состояния авторизации
auth.onAuthStateChanged(async (user) => {
    if (user) {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        updateUI(user, userData);
    } else {
        userSection.innerHTML = '';
        authButtons.style.display = 'flex';
    }
});

// Функция обновления UI
function updateUI(user, userData) {
    authButtons.style.display = 'none';
    userSection.innerHTML = `
        <span>Привет, ${userData?.username || user.email}</span>
        <button onclick="logout()" class="btn-secondary">Выйти</button>
    `;
    loadTopics();
}

// Функция выхода
async function logout() {
    try {
        await auth.signOut();
        window.location.reload();
    } catch (error) {
        alert('Ошибка при выходе: ' + error.message);
    }
}

// Загрузка тем
async function loadTopics() {
    try {
        const topicsSnapshot = await db.collection('topics')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();

        topicsList.innerHTML = '';
        topicsSnapshot.forEach(doc => {
            const topic = doc.data();
            const topicElement = document.createElement('div');
            topicElement.className = 'topic';
            topicElement.innerHTML = `
                <h3><a href="#" class="topic-link" data-id="${doc.id}">${topic.title}</a></h3>
                <p>${topic.content}</p>
                <div class="topic-meta">
                    <span>Автор: ${topic.authorName}</span>
                    <span>Дата: ${topic.createdAt.toDate().toLocaleDateString()}</span>
                </div>
            `;
            topicsList.appendChild(topicElement);
        });

        // Добавляем обработчики клика на темы
        document.querySelectorAll('.topic-link').forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const topicId = link.getAttribute('data-id');
                await openTopic(topicId);
            });
        });
    } catch (error) {
        console.error('Ошибка при загрузке тем:', error);
    }
}

// Функция для открытия темы в модальном окне
async function openTopic(topicId) {
    try {
        const doc = await db.collection('topics').doc(topicId).get();
        if (!doc.exists) {
            alert('Тема не найдена');
            return;
        }
        const topic = doc.data();
        // Создаём модальное окно
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>${topic.title}</h2>
                <p>${topic.content}</p>
                <div class="topic-meta">
                    <span>Автор: ${topic.authorName}</span>
                    <span>Дата: ${topic.createdAt.toDate().toLocaleDateString()}</span>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('.close').onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    } catch (error) {
        alert('Ошибка при открытии темы');
    }
} 