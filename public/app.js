document.addEventListener('DOMContentLoaded', () => {
    // --- Views & Forms ---
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const dashboardView = document.getElementById('dashboard-view');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const createProjectForm = document.getElementById('create-project-form');
    
    // --- Messages & Links ---
    const loginMessage = document.getElementById('login-message');
    const registerMessage = document.getElementById('register-message');
    const projectMessage = document.getElementById('project-message');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    // --- Dashboard Elements ---
    const welcomeMessage = document.getElementById('welcome-message');
    const logoutBtn = document.getElementById('logout-btn');
    const projectsList = document.getElementById('projects-list');

    let activeCharts = {};
    let dataFetchIntervals = {};

    // --- Helper Functions ---
    const showMessage = (element, message, isError = false) => {
        element.textContent = message;
        element.style.color = isError ? 'var(--error-color)' : 'var(--success-color)';
    };

    const switchView = (viewToShow) => {
        [loginView, registerView, dashboardView].forEach(v => v.classList.add('hidden'));
        viewToShow.classList.remove('hidden');
    };

    const logout = () => {
        localStorage.removeItem('session');
        Object.values(dataFetchIntervals).forEach(clearInterval);
        Object.values(activeCharts).forEach(chart => chart.destroy());
        dataFetchIntervals = {};
        activeCharts = {};
        projectsList.innerHTML = '';
        switchView(loginView);
    };
    
    // --- Project & Charting Logic ---
    const setupDashboard = (name, email) => {
        welcomeMessage.textContent = `Welcome, ${name}!`;
        localStorage.setItem('session', JSON.stringify({ name, email }));
        switchView(dashboardView);
        fetchAndDisplayProjects(email);
    };

    const fetchAndDisplayProjects = async (email) => {
        try {
            const response = await fetch(`/user-projects/${email}`);
            if (!response.ok) throw new Error('Could not fetch projects.');
            const projects = await response.json();
            
            projectsList.innerHTML = '';
            Object.values(dataFetchIntervals).forEach(clearInterval);
            Object.values(activeCharts).forEach(chart => chart.destroy());
            dataFetchIntervals = {};
            activeCharts = {};

            if (projects.length === 0) {
                projectsList.innerHTML = '<p>You have no projects yet. Create one above!</p>';
            } else {
                projects.forEach(renderProjectCard);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
            projectsList.innerHTML = '<p class="error">Could not load your projects.</p>';
        }
    };

    const renderProjectCard = (project) => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.id = `project-${project.token}`;

        let graphsHTML = '';
        project.sensordata.forEach(sensor => {
            graphsHTML += `
                <div class="sensor-graph-card" id="${sensor.id}">
                    <form class="sensor-edit-form" onsubmit="updateSensorInfo(event, '${project.token}', '${sensor.id}')">
                        <div class="form-grid">
                            <input type="text" name="title" value="${sensor.title}" required>
                            <select name="typeOfPin">
                                <option value="Analog" ${sensor.typeOfPin === 'Analog' ? 'selected' : ''}>Analog</option>
                                <option value="Digital" ${sensor.typeOfPin === 'Digital' ? 'selected' : ''}>Digital</option>
                            </select>
                            <input type="text" name="pinNumber" value="${sensor.pinNumber}" required>
                        </div>
                        <button type="submit">Update</button>
                    </form>
                    <div class="chart-container">
                        <canvas id="chart-${project.token}-${sensor.id}"></canvas>
                    </div>
                </div>
            `;
        });

        card.innerHTML = `
            <div class="project-header">
                <h4>${project.projectName}</h4>
                <span class="dev-board">${project.developmentBoard}</span>
            </div>
            <p class="project-description">${project.description}</p>
            <div class="token-display">
                <code id="token-${project.token}">${project.token}</code>
                <button onclick="copyToken('${project.token}')">Copy</button>
            </div>
            <div class="graphs-container">${graphsHTML}</div>
        `;
        projectsList.appendChild(card);

        // Render charts for each sensor
        project.sensordata.forEach(sensor => {
            renderChartForSensor(project.token, sensor);
        });
    };

    const renderChartForSensor = (token, sensor) => {
        const chartId = `chart-${token}-${sensor.id}`;
        if (activeCharts[chartId]) activeCharts[chartId].destroy();
        
        const ctx = document.getElementById(chartId).getContext('2d');
        activeCharts[chartId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: sensor.title,
                    data: [],
                    borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true,
                    tension: 0.4,
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: false }, x: { ticks: { display: false } } },
                plugins: { legend: { display: true } }
            }
        });

        // Fetch initial data and set up interval for the whole project
        if (!dataFetchIntervals[token]) {
            fetchAndDisplayData(token);
            dataFetchIntervals[token] = setInterval(() => fetchAndDisplayData(token), 5000);
        }
    };
    
    const fetchAndDisplayData = async (token) => {
        try {
            const response = await fetch(`/data/${token}`);
            if (!response.ok) {
                if (response.status === 404) clearInterval(dataFetchIntervals[token]);
                throw new Error('Could not fetch data for token ' + token);
            }
            const allSensorsData = await response.json();
            allSensorsData.forEach(sensorData => {
                updateChart(token, sensorData);
            });
        } catch (error) {
            console.error(error);
        }
    };

    const updateChart = (token, sensorData) => {
        const chartId = `chart-${token}-${sensorData.id}`;
        const chart = activeCharts[chartId];
        if (!chart) return;

        const labels = sensorData.data.map(d => new Date(d.datetime).toLocaleTimeString());
        const values = sensorData.data.map(d => d.value);

        chart.data.labels = labels;
        chart.data.datasets[0].data = values;
        chart.data.datasets[0].label = sensorData.title; // Update title in case it changed
        chart.update();
    };

    // --- Global Functions for onclick events ---
    window.copyToken = (token) => {
        navigator.clipboard.writeText(token).then(() => alert('Token copied!'));
    };

    window.updateSensorInfo = async (event, token, sensorId) => {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = {
            token,
            sensorId,
            title: formData.get('title'),
            typeOfPin: formData.get('typeOfPin'),
            pinNumber: formData.get('pinNumber')
        };

        const response = await fetch('/update-sensor-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        if(response.ok) {
            alert('Sensor updated!');
            // Update chart title live
            const chartId = `chart-${token}-${sensorId}`;
            if(activeCharts[chartId]) {
                activeCharts[chartId].data.datasets[0].label = data.title;
                activeCharts[chartId].update();
            }
        } else {
            alert(`Error: ${result.message}`);
        }
    };

    // --- Event Listeners ---
    showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); switchView(registerView); });
    showLoginLink.addEventListener('click', (e) => { e.preventDefault(); switchView(loginView); });
    logoutBtn.addEventListener('click', logout);

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(new FormData(e.target)))
        });
        const result = await response.json();
        showMessage(registerMessage, result.message, !response.ok);
        if (response.ok) setTimeout(() => switchView(loginView), 2000);
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(new FormData(e.target)))
        });
        const result = await response.json();
        if (response.ok) {
            setupDashboard(result.name, email);
        } else {
            showMessage(loginMessage, result.message, true);
        }
    });
    
    createProjectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const session = JSON.parse(localStorage.getItem('session'));
        if (!session?.email) {
            showMessage(projectMessage, "Session expired. Please log in again.", true);
            return;
        }
        const data = Object.fromEntries(new FormData(e.target));
        data.email = session.email;

        const response = await fetch('/create-project', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        showMessage(projectMessage, result.message, !response.ok);
        if (response.ok) {
            createProjectForm.reset();
            fetchAndDisplayProjects(session.email);
            setTimeout(() => showMessage(projectMessage, ""), 3000);
        }
    });

    // --- Initial Check ---
    const savedSession = localStorage.getItem('session');
    if (savedSession) {
        const { name, email } = JSON.parse(savedSession);
        setupDashboard(name, email);
    } else {
        switchView(loginView);
    }
});
