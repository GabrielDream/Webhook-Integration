const form = document.querySelector('form');

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const messageEl = document.getElementById('loginMessage');

function showMessage(text) {
	messageEl.textContent = text;
	messageEl.classList.remove('hidden');
}

function clearMessage() {
	messageEl.textContent = '';
	messageEl.classList.add('hidden');
}

form.addEventListener('submit', async (event) => {
	event.preventDefault();
	clearMessage();

	const email = emailInput.value.trim();
	const password = passwordInput.value;

	if (!email || !password) {
		showMessage('Email and password are required.');
		return;
	}

	try {
		const response = await fetch('http://localhost:3051/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ email, password })
		});

		const result = await response.json();

		if (!response.ok) {
			if (response.status === 401) {
				showMessage('Email ou senha incorretos.');
				return;
			}

			showMessage('Falha no login.');
			return;
		}

		// ✅ SUCCESS
		const { token } = result.data;
		localStorage.setItem('authToken', token);

		window.location.href = 'dashboard.html';
	} catch (err) {
		console.error(err);
		showMessage('Unable to connect to server.');
	}
});
