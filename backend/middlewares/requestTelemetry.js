import { logDebug } from '../terminalStylization/logger.js';

export default function requestTelemetry(req, res, next) {
	const startedAt = Date.now();

	res.on('finish', () => {
		const durationMs = Date.now() - startedAt;

		logDebug(`[telemetry] ${req.method} ${req.originalUrl} status=${res.statusCode} durationMs=${durationMs}`);
		// opcional (2.4/UI): correlação
		// const rid = req.id; // se você tiver requestId middleware
		// logDebug(`[telemetry] rid=${rid} ...`);

		// opcional (2.4/UI): só logar slow requests
		// if (durationMs > 500) logWarn(`[telemetry] SLOW ... durationMs=${durationMs}`);
	});

	next();
}
