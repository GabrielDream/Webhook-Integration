// dashboard.js

const backendStatusEl = document.getElementById('BackendStatus');
const eventsTbody = document.getElementById('EventsTbody');

// 1️⃣ Lê token
const token = localStorage.getItem('authToken');
if (!token) {
	// Não está logado
	window.location.href = 'index.html';
}

// helper: formata data simples
function formatDate(isoString) {
	if (!isoString) return '-';

	const d = new Date(isoString);

	// Se for inválida
	if (Number.isNaN(d.getTime())) return String(isoString);

	return d.toLocaleString();
}

function clearTbody() {
	if (!eventsTbody) return;
	eventsTbody.innerHTML = '';
}

function renderRow(cols) {
	const tr = document.createElement('tr');

	for (const col of cols) {
		const td = document.createElement('td');
		td.textContent = col;
		tr.appendChild(td);
	}

	return tr;
}

function renderEvents(events) {
	if (!eventsTbody) return;

	clearTbody();

	if (!events || !Array.isArray(events) || events.length === 0) {
		eventsTbody.appendChild(renderRow(['-', '-', '-', '-', '-', 'Sem eventos ainda']));
		return;
	}

	for (const ev of events) {
		let eventType = '-';
		if (ev && ev.eventType) eventType = String(ev.eventType);

		let eventId = '-';
		if (ev && ev.eventId) eventId = String(ev.eventId);

		// Ainda não temos "repo" e "actor" salvos no DB → placeholder
		let repo = '-';
		let actor = '-';

		let status = '-';
		if (ev && ev.status) status = String(ev.status);

		let receivedAt = '-';
		if (ev && ev.createdAt) receivedAt = formatDate(ev.createdAt);

		const tr = renderRow([eventType, eventId, repo, actor, status, receivedAt]);
		eventsTbody.appendChild(tr);
	}
}

// 2️⃣ Valida sessão com getMe
async function checkSession() {
	try {
		const response = await fetch('http://localhost:3051/me', {
			method: 'GET',
			headers: {
				Authorization: 'Bearer ' + token
			}
		});

		if (!response.ok) {
			// Token inválido / expirado / revogado
			localStorage.removeItem('authToken');
			window.location.href = 'index.html';
			return false;
		}

		const result = await response.json();

		// Sessão válida
		const user = result.data;

		let email = '-';
		let role = '-';

		if (user && user.email) email = String(user.email);
		if (user && user.role) role = String(user.role);

		backendStatusEl.textContent = 'Status: conected as ' + email + ' (' + role + ')';
		return true;
	} catch (err) {
		console.error('Erro ao validar sessão:', err);
		backendStatusEl.textContent = 'Status: ERROR to connect with backend';
		return false;
	}
}

// 3️⃣ Busca eventos no backend e renderiza
async function loadEvents() {
	if (!eventsTbody) return;

	try {
		const response = await fetch('http://localhost:3051/events', {
			method: 'GET',
			headers: {
				Authorization: 'Bearer ' + token
			}
		});

		let result = null;
		try {
			result = await response.json();
		} catch (err) {
			result = null;
		}

		if (!response.ok) {
			if (response.status === 401) {
				localStorage.removeItem('authToken');
				window.location.href = 'index.html';
				return;
			}

			clearTbody();
			eventsTbody.appendChild(renderRow(['-', '-', '-', '-', '-', 'Erro ao carregar eventos']));
			return;
		}

		let events = [];
		if (result && result.data && Array.isArray(result.data.events)) {
			events = result.data.events;
		}

		renderEvents(events);
	} catch (err) {
		console.error('Erro ao buscar eventos:', err);
		clearTbody();
		eventsTbody.appendChild(renderRow(['-', '-', '-', '-', '-', 'Erro ao buscar eventos']));
	}
}

// boot
async function init() {
	const ok = await checkSession();
	if (!ok) return;

	await loadEvents();

	// opcional: auto refresh
	// setInterval(loadEvents, 5000);
}

init();