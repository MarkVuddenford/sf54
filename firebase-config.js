// Конфигурация Firebase
const firebaseConfig = {
    // Здесь нужно вставить ваши данные из Firebase Console
    apiKey: "AIzaSyBoPMUYUvxfVeEYEAsZ-x0hT6WD6pLS-PY",
    authDomain: "scpforum-63fef.firebaseapp.com",
    projectId: "scpforum-63fef",
    storageBucket: "scpforum-63fef.firebasestorage.app",
    messagingSenderId: "692189262987",
    appId: "1:692189262987:web:9dcfdc73fab3a11562d08e"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);

// Получение ссылок на сервисы
const auth = firebase.auth();
const db = firebase.firestore(); 