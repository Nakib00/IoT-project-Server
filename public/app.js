document.addEventListener('DOMContentLoaded', () => {
    // Views
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const dashboardView = document.getElementById('dashboard-view');

    // Forms & Messages
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginMessage = document.getElementById('login-message');
    const registerMessage = document.getElementById('register-message');

    // View switch links
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    // Dashboard Elements
    const welcomeMessage = document.getElementById('welcome-message');
    const userTokenEl = document.getElementById('user-token');
    const logoutBtn = document.getElementById('logout-btn');
    const copyTokenBtn = document.getElementById('copy-token-btn');
    const regenerateTokenBtn = document.getElementById('regenerate-token-btn');
    const chartCanvas = document.getElementById('temp-chart');

    let tempChart;
    let dataFetchInterval;

    // --- Helper Functions ---
    const showMessage = (element, message, isError = false) => {
        element.textContent = message;
        element.style.color = isError ? 'var(--error-color)' : 'var(--success-color)';
    };

    const switchView = (viewToShow) => {
        [loginView, registerView, dashboardView].forEach(view => view.classList.add('hidden'));
        viewToShow.classList.remove('hidden');
    };

    const setupDashboard = (name, token) => {
        welcomeMessage.textContent = `Welcome, ${name}!`;
        userTokenEl.textContent = token;
        localStorage.setItem('session', JSON.stringify({ name, token }));
        switchView(dashboardView);
        renderChart();
        fetchAndDisplayData(token);
        dataFetchInterval = setInterval(() => fetchAndDisplayData(token), 5000);
    };

    // --- Charting ---
    const renderChart = () => {
        if (tempChart) {
            tempChart.destroy();
        }
        const ctx = chartCanvas.getContext('2d');
        tempChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Temperature (°C)',
                    data: [],
                    borderColor: 'var(--primary-color)',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true,
                    tension: 0.4,
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: false },
                    x: { ticks: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });
    };

    const updateChart = (data) => {
        if (!tempChart) return;
        const labels = data.map(d => new Date(d.timestamp).toLocaleTimeString());
        const tempData = data.map(d => d.temperature);

        tempChart.data.labels = labels;
        tempChart.data.datasets[0].data = tempData;
        tempChart.update();
    };


    // --- Data & Auth Logic ---
    const fetchAndDisplayData = async (token) => {
        try {
            const response = await fetch(`/data/${token}`);
            if (!response.ok) {
                if(response.status === 404) logout(); // Invalid token, log out
                throw new Error('Could not fetch data.');
            }
            const data = await response.json();
            updateChart(data);
        } catch (error) {
            console.error('Error fetching data:', error);
            if(dataFetchInterval) clearInterval(dataFetchInterval);
        }
    };

    const logout = () => {
        localStorage.removeItem('session');
        if (dataFetchInterval) clearInterval(dataFetchInterval);
        switchView(loginView);
    };

    // --- Event Listeners ---
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(registerView);
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(loginView);
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            name: document.getElementById('register-name').value,
            email: document.getElementById('register-email').value,
            phone: document.getElementById('register-phone').value,
            password: document.getElementById('register-password').value,
        };

        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        const result = await response.json();
        showMessage(registerMessage, result.message, !response.ok);
        if (response.ok) {
            registerForm.reset();
            setTimeout(() => switchView(loginView), 2000);
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: document.getElementById('login-email').value,
                password: document.getElementById('login-password').value,
            }),
        });
        const result = await response.json();
        if (response.ok) {
            setupDashboard(result.name, result.token);
        } else {
            showMessage(loginMessage, result.message, true);
        }
    });

    logoutBtn.addEventListener('click', logout);

    copyTokenBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(userTokenEl.textContent).then(() => {
            alert('Token copied!');
        });
    });

    regenerateTokenBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure? This will invalidate your old token.')) return;
        
        const session = JSON.parse(localStorage.getItem('session'));
        const response = await fetch('/regenerate-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentToken: session.token }),
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            setupDashboard(session.name, result.newToken);
        } else {
            alert(`Error: ${result.message}`);
        }
    });

    // --- Initial Check ---
    const savedSession = localStorage.getItem('session');
    if (savedSession) {
        const { name, token } = JSON.parse(savedSession);
        setupDashboard(name, token);
    } else {
        switchView(loginView);
    }
});
