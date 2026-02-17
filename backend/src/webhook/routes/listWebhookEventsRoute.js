// src/webhook/routes/listWebhookEventsRoute.js
import { Router } from 'express';

import { prisma } from '../../users/db/prisma.js';

import AppError from '../../../middlewares/AppError.js';
import authRequired from '../../auth/guards/authRequired.js';

import { logWarn, logError, logDebug, logSuccess } from '../../../terminalStylization/logger.js';

export const router = Router();

/**
 * GET /events
 * Private — List last webhook events (dashboard)
 */
router.get('/events', authRequired, async (req, res, next) => {
	try {
		logDebug('📥 EVENTS LIST REQUEST');

		const events = await prisma.webhookEvent.findMany({
			orderBy: { createdAt: 'desc' },
			take: 50,
			select: {
				eventId: true,
				eventType: true,
				provider: true,
				status: true,
				createdAt: true,
				processedAt: true,
				failedAt: true,
				failReason: true
			}
		});

		logSuccess(`✅ EVENTS LISTED: count=${events.length}`);

		return res.success({
			statusCode: 200,
			message: 'EVENTS_LISTED',
			data: { events }
		});
	} catch (err) {
		logError('❌ ERROR IN GET /events!');
		logError(err);

		if (err instanceof AppError) return next(err);

		return next(new AppError('UNEXPECTED ERROR IN EVENTS LIST!', 500, 'EVENTS', 'ERR_EVENTS_LIST_FAILED'));
	}
});
