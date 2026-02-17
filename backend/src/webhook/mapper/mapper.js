// src/webhooks/mapper/mapGithubHookPayload.js
import AppError from '../../../middlewares/AppError.js';

function ensureString(value, fieldName) {
	if (typeof value !== 'string' || value.trim().length === 0) {
		throw new AppError('INVALID_INPUT', 400, fieldName, 'ERR_INVALID_INPUT');
	}
	return value;
}

export function mapGithubHookPayloadInternal({ eventId, eventType, body }) {
	if (!body || typeof body !== 'object') {
		throw new AppError('INVALID_INPUT', 400, 'body', 'ERR_INVALID_INPUT');
	}

	const normalizedEventId = ensureString(eventId, 'eventId');
	const normalizedEventType = ensureString(eventType, 'eventType');

	// Evento automático do GitHub ao configurar/testar webhook
	if (normalizedEventType === 'ping') {
		let hookId = null;

		if (body.hook && body.hook.id) {
			hookId = String(body.hook.id);
		}

		return {
			provider: 'github',
			eventId: normalizedEventId,
			eventType: normalizedEventType,
			data: {
				message: 'github webhook ping',
				hookId
			}
		};
	}

	// MVP: qualquer evento que não seja "push"
	if (normalizedEventType !== 'push') {
		return {
			provider: 'github',
			eventId: normalizedEventId,
			eventType: normalizedEventType,
			data: {
				raw: body
			}
		};
	}

	// ===== PUSH EVENT =====
	let repoFullName = null;
	let repoUrl = null;

	if (body.repository && typeof body.repository === 'object') {
		if (typeof body.repository.full_name === 'string') {
			repoFullName = body.repository.full_name;
		}
		if (typeof body.repository.html_url === 'string') {
			repoUrl = body.repository.html_url;
		}
	}

	let ref = null;
	if (typeof body.ref === 'string') {
		ref = body.ref;
	}

	let commitCount = 0;
	if (Array.isArray(body.commits)) {
		commitCount = body.commits.length;
	}

	let headCommitId = null;
	let headCommitMessage = null;

	if (body.head_commit && typeof body.head_commit === 'object') {
		if (typeof body.head_commit.id === 'string') {
			headCommitId = body.head_commit.id;
		}
		if (typeof body.head_commit.message === 'string') {
			headCommitMessage = body.head_commit.message;
		}
	}

	let actorLogin = null;
	if (body.sender && typeof body.sender.login === 'string') {
		actorLogin = body.sender.login;
	}

	let pusherName = null;
	if (body.pusher && typeof body.pusher.name === 'string') {
		pusherName = body.pusher.name;
	}

	return {
		provider: 'github',
		eventId: normalizedEventId,
		eventType: normalizedEventType,
		data: {
			repo: {
				fullName: repoFullName,
				url: repoUrl
			},
			ref,
			actor: {
				login: actorLogin,
				pusherName
			},
			commits: {
				count: commitCount,
				head: {
					id: headCommitId,
					message: headCommitMessage
				}
			}
		}
	};
}
