// Подключение к WebSocket
const socket = io();

// Обработка подключения
socket.on('connect', () => {
    console.log('Connected to server');
});

// Обработка отключения
socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

// Обработка ошибок
socket.on('error', (error) => {
    console.error('Socket error:', error);
});

// Функция для обновления времени на форуме
function updateForumTime() {
    if (document.querySelector('.user-stats')) {
        const timeElement = document.querySelector('.user-stats p:last-child');
        if (timeElement) {
            const currentTime = parseInt(timeElement.textContent.match(/\d+/)[0]);
            timeElement.textContent = `Время на форуме: ${currentTime + 1} часов`;
        }
    }
}

// Обновление времени каждую минуту
setInterval(updateForumTime, 60000);

// Функция для проверки мута
function checkMuteStatus() {
    fetch('/api/check-mute')
        .then(response => response.json())
        .then(data => {
            if (data.isMuted) {
                const muteMessage = document.createElement('div');
                muteMessage.className = 'mute-message';
                muteMessage.textContent = `Вы находитесь в муте до ${new Date(data.muteExpires).toLocaleString()}`;
                document.body.appendChild(muteMessage);
                
                // Отключаем возможность отправки сообщений
                const messageForms = document.querySelectorAll('form');
                messageForms.forEach(form => {
                    form.addEventListener('submit', (e) => {
                        e.preventDefault();
                        alert(`Вы находитесь в муте до ${new Date(data.muteExpires).toLocaleString()}`);
                    });
                });
            }
        })
        .catch(error => console.error('Error checking mute status:', error));
}

// Проверка мута при загрузке страницы
checkMuteStatus();

// Функция для проверки бана
function checkBanStatus() {
    fetch('/api/check-ban')
        .then(response => response.json())
        .then(data => {
            if (data.isBanned) {
                const banMessage = document.createElement('div');
                banMessage.className = 'ban-message';
                banMessage.innerHTML = `
                    <h2>Доступ запрещен</h2>
                    <p>Вы забанены до ${new Date(data.banExpires).toLocaleString()}</p>
                    <p>Причина: ${data.banReason}</p>
                `;
                document.body.innerHTML = '';
                document.body.appendChild(banMessage);
            }
        })
        .catch(error => console.error('Error checking ban status:', error));
}

// Проверка бана при загрузке страницы
checkBanStatus();

// Функция для обновления ранга пользователя
function updateUserRank(forumTime) {
    const ranks = {
        0: 'Новичок',
        10: 'Исследователь-стажер',
        50: 'Исследователь',
        100: 'Старший исследователь',
        200: 'Ведущий исследователь',
        500: 'Главный исследователь',
        1000: 'Директор исследований',
        2000: 'Заместитель директора',
        5000: 'Директор Фонда'
    };

    let currentRank = 'Новичок';
    for (const [time, rank] of Object.entries(ranks)) {
        if (forumTime >= parseInt(time)) {
            currentRank = rank;
        }
    }

    const rankElement = document.querySelector('.rank-badge');
    if (rankElement) {
        rankElement.textContent = currentRank;
    }
}

// Обработка создания новой темы
document.getElementById('newTopicForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('topicTitle').value,
        content: document.getElementById('topicContent').value,
        isLocked: document.getElementById('topicLocked').checked
    };

    try {
        const response = await fetch('/api/topics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (data.success) {
            window.location.href = `/topic/${data.topicId}`;
        } else {
            alert(data.error || 'Ошибка при создании темы');
        }
    } catch (error) {
        alert('Ошибка при создании темы');
    }
});

// Обработка отправки сообщения в теме
document.getElementById('postForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        content: document.getElementById('postContent').value,
        topicId: document.getElementById('postForm').dataset.topicId
    };

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (data.success) {
            location.reload();
        } else {
            alert(data.error || 'Ошибка при отправке сообщения');
        }
    } catch (error) {
        alert('Ошибка при отправке сообщения');
    }
});

// Обработка редактирования сообщения
function editPost(postId) {
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    const content = postElement.querySelector('.post-content').textContent;
    
    const editForm = document.createElement('form');
    editForm.innerHTML = `
        <textarea>${content}</textarea>
        <button type="submit">Сохранить</button>
        <button type="button" onclick="cancelEdit(${postId})">Отмена</button>
    `;
    
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newContent = editForm.querySelector('textarea').value;
        
        try {
            const response = await fetch(`/api/posts/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: newContent })
            });

            const data = await response.json();
            if (data.success) {
                location.reload();
            } else {
                alert(data.error || 'Ошибка при редактировании сообщения');
            }
        } catch (error) {
            alert('Ошибка при редактировании сообщения');
        }
    });
    
    postElement.innerHTML = '';
    postElement.appendChild(editForm);
}

// Отмена редактирования сообщения
function cancelEdit(postId) {
    location.reload();
}

// Обработка удаления сообщения
async function deletePost(postId) {
    if (!confirm('Вы уверены, что хотите удалить это сообщение?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (data.success) {
            location.reload();
        } else {
            alert(data.error || 'Ошибка при удалении сообщения');
        }
    } catch (error) {
        alert('Ошибка при удалении сообщения');
    }
}

// Обработка закрытия темы
async function closeTopic(topicId) {
    if (!confirm('Вы уверены, что хотите закрыть эту тему?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/topics/${topicId}/close`, {
            method: 'POST'
        });

        const data = await response.json();
        if (data.success) {
            location.reload();
        } else {
            alert(data.error || 'Ошибка при закрытии темы');
        }
    } catch (error) {
        alert('Ошибка при закрытии темы');
    }
}

// Обработка блокировки темы
async function lockTopic(topicId) {
    if (!confirm('Вы уверены, что хотите заблокировать эту тему?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/topics/${topicId}/lock`, {
            method: 'POST'
        });

        const data = await response.json();
        if (data.success) {
            location.reload();
        } else {
            alert(data.error || 'Ошибка при блокировке темы');
        }
    } catch (error) {
        alert('Ошибка при блокировке темы');
    }
} 