document.addEventListener('DOMContentLoaded', () => {
    // --- View and Form Element References ---
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const dashboardView = document.getElementById('dashboard-view');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const createProjectForm = document.getElementById('create-project-form');

    // --- Message and Link References ---
    const loginMessage = document.getElementById('login-message');
    const registerMessage = document.getElementById('register-message');
    const projectMessage = document.getElementById('project-message');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    // --- Dashboard Element References ---
    const welcomeMessage = document.getElementById('welcome-message');
    const logoutBtn = document.getElementById('logout-btn');
    const projectsList = document.getElementById('projects-list');

    // --- State Management ---
    let activeCharts = {};
    let dataFetchIntervals = {};

    // --- Utility Functions ---

    /**
     * Displays a message to the user.
     * @param {HTMLElement} element - The element to display the message in.
     * @param {string} message - The message text.
     * @param {boolean} isError - Whether the message is an error.
     */
    const showMessage = (element, message, isError = false) => {
        element.textContent = message;
        element.style.color = isError ? 'var(--error-color)' : 'var(--success-color)';
    };

    /**
     * Switches the currently visible view.
     * @param {HTMLElement} viewToShow - The view to make visible.
     */
    const switchView = (viewToShow) => {
        [loginView, registerView, dashboardView].forEach(v => v.classList.add('hidden'));
        viewToShow.classList.remove('hidden');
    };

    /**
     * Handles user logout.
     */
    const logout = () => {
        localStorage.removeItem('session');
        Object.values(dataFetchIntervals).forEach(clearInterval);
        Object.values(activeCharts).forEach(chart => chart.destroy());
        dataFetchIntervals = {};
        activeCharts = {};
        projectsList.innerHTML = '';
        switchView(loginView);
    };

    // --- Dashboard and Project Logic ---

    /**
     * Sets up the dashboard view for a logged-in user.
     * @param {string} name - The user's name.
     * @param {string} email - The user's email.
     */
    const setupDashboard = (name, email) => {
        welcomeMessage.textContent = `Welcome, ${name}!`;
        localStorage.setItem('session', JSON.stringify({ name, email }));
        switchView(dashboardView);
        fetchAndDisplayProjects(email);
    };

    /**
     * Fetches and displays all projects for a given user.
     * @param {string} email - The user's email.
     */
    const fetchAndDisplayProjects = async (email) => {
        try {
            const response = await fetch(`/user-projects/${email}`);
            const result = await response.json();

            if (!result.success) throw new Error(result.message || 'Could not fetch projects.');
            
            const projects = result.data.projects;

            // Clear existing projects and intervals
            projectsList.innerHTML = '';
            Object.values(dataFetchIntervals).forEach(clearInterval);
            Object.values(activeCharts).forEach(chart => chart.destroy());
            activeCharts = {};
            dataFetchIntervals = {};

            if (projects.length === 0) {
                projectsList.innerHTML = '<p>You have no projects yet. Create one above!</p>';
            } else {
                projects.forEach(renderProjectCard);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
            projectsList.innerHTML = `<p style="color: var(--error-color);">${error.message}</p>`;
        }
    };

    /**
     * Renders a single project card with its sensors and charts.
     * @param {object} project - The project data object.
     */
    const renderProjectCard = (project) => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.id = `project-${project.token}`;

        let graphsHTML = '';
        project.sensordata.forEach(sensor => {
            graphsHTML += `
                <div class="sensor-graph-card" id="sensor-card-${project.token}-${sensor.id}">
                    <form class="sensor-edit-form" onsubmit="updateSensorInfo(event, '${project.token}', '${sensor.id}')">
                        <div class="form-grid">
                            <input type="text" name="title" value="${sensor.title}" placeholder="Sensor Title" required>
                            <select name="typeOfPin">
                                <option value="Analog" ${sensor.typeOfPin === 'Analog' ? 'selected' : ''}>Analog</option>
                                <option value="Digital" ${sensor.typeOfPin === 'Digital' ? 'selected' : ''}>Digital</option>
                            </select>
                            <input type="text" name="pinNumber" value="${sensor.pinNumber}" placeholder="Pin (e.g., A0)" required>
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
                <code id="token-text-${project.token}">${project.token}</code>
                <button onclick="copyToken('${project.token}')">Copy</button>
            </div>
            <div class="graphs-container">${graphsHTML}</div>
        `;
        projectsList.appendChild(card);

        // Render charts for each sensor and start fetching data
        project.sensordata.forEach(sensor => {
            renderChartForSensor(project.token, sensor);
        });
    };

    /**
     * Renders a chart for a specific sensor and starts data fetching.
     * @param {string} token - The project token.
     * @param {object} sensor - The sensor data object.
     */
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
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: false }, x: { ticks: { display: false } } },
                plugins: { legend: { display: true } }
            }
        });

        // Start fetching data for the entire project if not already started
        if (!dataFetchIntervals[token]) {
            const fetchData = () => fetchAndDisplayData(token);
            fetchData(); // Initial fetch
            dataFetchIntervals[token] = setInterval(fetchData, 5000); // Fetch every 5 seconds
        }
    };
    
    /**
     * Fetches and updates data for all sensors in a project.
     * @param {string} token - The project token.
     */
    const fetchAndDisplayData = async (token) => {
        try {
            const response = await fetch(`/data/${token}`);
            const result = await response.json();
            
            if (!result.success) {
                if (response.status === 404) clearInterval(dataFetchIntervals[token]);
                throw new Error('Could not fetch data for token ' + token);
            }
            const allSensorsData = result.data.sensordata;
            allSensorsData.forEach(sensorData => {
                updateChart(token, sensorData);
            });
        } catch (error) {
            console.error(error);
        }
    };

    /**
     * Updates a specific chart with new data.
     * @param {string} token - The project token.
     * @param {object} sensorData - The updated sensor data.
     */
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

    // --- Global Functions (for onclick handlers) ---

    /**
     * Copies the project token to the clipboard.
     * @param {string} token - The project token.
     */
    window.copyToken = (token) => {
        const tokenText = document.getElementById(`token-text-${token}`).innerText;
        navigator.clipboard.writeText(tokenText).then(() => {
            alert('Token copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy token: ', err);
            alert('Failed to copy token.');
        });
    };

    /**
     * Handles the submission of the sensor info update form.
     * @param {Event} event - The form submission event.
     * @param {string} token - The project token.
     * @param {string} sensorId - The ID of the sensor being updated.
     */
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

        try {
            const response = await fetch('/update-sensor-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            if (!result.success) throw new Error(result.message);

            alert('Sensor updated successfully!');
            // Update the chart's title live
            const chartId = `chart-${token}-${sensorId}`;
            if(activeCharts[chartId]) {
                activeCharts[chartId].data.datasets[0].label = data.title;
                activeCharts[chartId].update();
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    // --- Event Listeners Setup ---
    showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); switchView(registerView); });
    showLoginLink.addEventListener('click', (e) => { e.preventDefault(); switchView(loginView); });
    logoutBtn.addEventListener('click', logout);

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            showMessage(registerMessage, result.message, !result.success);
            if (result.success) {
                setTimeout(() => switchView(loginView), 2000);
            }
        } catch (error) {
            showMessage(registerMessage, 'An unexpected error occurred.', true);
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.success) {
                setupDashboard(result.data.name, result.data.email);
            } else {
                showMessage(loginMessage, result.message, true);
            }
        } catch (error) {
            showMessage(loginMessage, 'An unexpected error occurred.', true);
        }
    });
    
    createProjectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const session = JSON.parse(localStorage.getItem('session'));
        if (!session?.email) {
            showMessage(projectMessage, "Session expired. Please log in again.", true);
            logout();
            return;
        }
        const data = Object.fromEntries(new FormData(e.target));
        data.email = session.email;

        try {
            const response = await fetch('/create-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            showMessage(projectMessage, result.message, !result.success);
            if (result.success) {
                createProjectForm.reset();
                fetchAndDisplayProjects(session.email);
                setTimeout(() => showMessage(projectMessage, ""), 3000);
            }
        } catch (error) {
            showMessage(projectMessage, 'An unexpected error occurred.', true);
        }
    });

    // --- Initial Application State Check ---
    const savedSession = localStorage.getItem('session');
    if (savedSession) {
        const { name, email } = JSON.parse(savedSession);
        setupDashboard(name, email);
    } else {
        switchView(loginView);
    }
});
