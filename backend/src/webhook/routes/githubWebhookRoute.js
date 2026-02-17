// src/webhooks/routes/githubWebhookRoute.js
import { Router } from 'express';

import AppError from '../../../middlewares/AppError.js';
import requestTelemetry from '../../../middlewares/requestTelemetry.js';

import { logInfo, logWarn, logError, logDebug, logSuccess } from '../../../terminalStylization/logger.js';

import githubSignatureRequired from '../security/githubSignatureRequired.js';

import { acquireEventLock, markProcessed, markFailed } from '../store/idempotency.js';
import { validateWebhookCore } from '../validator/payloadValidator.js';

import { mapGithubHookPayloadInternal } from '../mapper/mapper.js';

export const router = Router();

/**
 * POST /github-webhook
 * Public — GitHub Webhook Receiver (HMAC signature)
 */
router.post('/github-webhook', requestTelemetry, githubSignatureRequired, async (req, res, next) => {
	let payloadNormalized = null;

	try {
		const eventIdHeader = req.get('X-GitHub-Delivery');
		const eventTypeHeader = req.get('X-GitHub-Event');

		// Normaliza / traduz (GitHub -> contrato interno)
		payloadNormalized = mapGithubHookPayloadInternal({
			eventId: eventIdHeader,
			eventType: eventTypeHeader,
			body: req.body
		});

		// contrato universal mínimo
		validateWebhookCore(payloadNormalized);

		// desestruturação semântica
		const eventId = payloadNormalized.eventId;
		const eventType = payloadNormalized.eventType;
		const provider = payloadNormalized.provider;

		logInfo(`[github-webhook] received eventId=${eventId} type=${eventType}`);

		// idempotência: tenta adquirir lock no DB
		const lock = await acquireEventLock({ eventId, eventType, provider });

		if (!lock.acquired) {
			if (lock.status === 'PROCESSED') {
				logInfo(`[github-webhook] duplicate processed eventId=${eventId}`);
				return res.success({ statusCode: 200, message: 'ACK_DUPLICATE' });
			}

			if (lock.status === 'PROCESSING') {
				logWarn(`[github-webhook] duplicate in-progress eventId=${eventId}`);
				return res.success({ statusCode: 200, message: 'ACK_IN_PROGRESS' });
			}

			if (lock.status === 'FAILED') {
				logWarn(`[github-webhook] duplicate failed eventId=${eventId}`);
				return res.success({ statusCode: 200, message: 'ACK_DUPLICATE_FAILED' });
			}

			logWarn('[github-webhook] duplicate with missing status', { eventId });
			return res.success({ statusCode: 200, message: 'ACK_DUPLICATE' });
		}

		logDebug(`[github-webhook] lock acquired eventId=${eventId} status=PROCESSING`);

		// MVP: sem processamento real; apenas marca como processado
		await markProcessed(eventId);

		logSuccess(`[github-webhook] event processed eventId=${eventId} status=PROCESSED`);

		return res.success({ statusCode: 200, message: 'ACK_PROCESSED' });
	} catch (err) {
		logError('❌ ERROR IN GITHUB WEBHOOK ROUTE!');
		logError(err);

		// tenta extrair eventId sem optional chaining
		let failedEventId = null;
		if (payloadNormalized && payloadNormalized.eventId) {
			failedEventId = payloadNormalized.eventId;
		}

		let reason = null;
		if (err) reason = err.code || err.message || null;

		// ⭐ ACK primeiro (não bloqueia provedor)
		res.success({ statusCode: 200, message: 'ACK_FAILED_RECORDED' });

		// ⭐ Depois: tenta marcar FAILED (fire-and-forget)
		if (failedEventId) {
			markFailed(failedEventId, reason)
				.then(() => {
					logInfo(`[github-webhook] status updated to FAILED eventId=${failedEventId}`);
				})
				.catch((dbErr) => {
					let dbError = null;
					if (dbErr && dbErr.message) dbError = dbErr.message;
					else dbError = String(dbErr);

					logWarn(`[github-webhook] failed to persist FAILED status eventId=${failedEventId}`, {
						dbError
					});
				});
		}

		// disciplina: já respondemos
		return;
	}
});
