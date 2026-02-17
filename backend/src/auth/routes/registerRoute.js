///register, /login, /logout
//ROTA PUBLICA: TODOS PODEM SE REGISTRAR.
import { Router } from 'express';
import { prisma } from '../../users/db/prisma.js';
import bcrypt from 'bcrypt';

import AppError from '../../../middlewares/AppError.js';

import {
	logInfo,
	logWarn,
	logError,
	logDebug,
	logSuccess,
	logData,
	logTimeStamp
} from '../../../terminalStylization/logger.js';

import { sanitizeUserInput } from '../../utils/sanitize.js';
export const router = Router();

/**
 * POST /auth/register
 * Public — Create a STAFF user
 * Fields: name (string), age (int 1-100), email (string), password (string forte)
 */

router.post('/register', async (req, res, next) => {
	try {
		const sanitizedBody = sanitizeUserInput(req.body);

		let { name, email, password } = sanitizedBody;

		// ✅ Oculta senha no log (segurança extra)
		const logSafeBody = {
			name: sanitizedBody.name,
			email: sanitizedBody.email,
			password: '***' // ← Sempre mascarado
		};

		logDebug('📥 REGISTER REQUEST BODY: ', logSafeBody);

		// -------------------------
		// BASIC VALIDATIONS
		// -------------------------
		if (!name || !email || !password) {
			logWarn('ALL FIELDS ARE REQUIRED!');
			throw new AppError('ALL FIELDS NEED TO BE FILLED!', 400, 'all', 'ERR_MISSING_FIELDS');
		}

		//Name validation: ✅ Trim aplicado antes da validação
		name = String(name ?? '').trim();
		if (/\d/.test(name) || name.length < 1) {
			//Test if theres number in name
			throw new AppError('ADD FUNCTION: INVALID NAME!', 400, 'NAME', 'ERR_INVALID_NAME');
		}

		//Email validation:
		email = String(email ?? '')
			.trim()
			.toLowerCase();
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			throw new AppError('INVALID EMAIL FORMAT!', 400, 'EMAIL', 'ERR_INVALID_EMAIL');
		}
		const existingEmail = await prisma.user.findUnique({ where: { email } });
		if (existingEmail) {
			logWarn('EMAIL IN USE!');
			throw new AppError('EMAIL ALREADY IN USE!', 400, 'EMAIL', 'ERR_EMAIL_IN_USE');
		}

		//Password validation. IMPORTANT: need to be checked password strength before HASH.
		password = String(password ?? '');
		if (password.length < 8 || password.length > 128) {
			throw new AppError('PASSWORD TOO SHORT', 400, 'PASSWORD', 'ERR_WEAK_PASSWORD');
		}
		const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
		const passwordHash = await bcrypt.hash(password, rounds);

		const newUser = await prisma.user.create({
			data: {
				name,
				email,
				passwordHash,
				role: 'STAFF' // força sempre STAFF
			},
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				createdAt: true
			}
		});

		logSuccess(`✅ NEW USER REGISTERED: Name: ${name}, Email: ${email}`);

		return res.success({
			statusCode: 201,
			message: 'SUCCESSFULLY REGISTERED!',
			data: {
				newUser
			}
		});
	} catch (err) {
		logError('❌ ERROR IN REGISTER FUNCTION!');
		logError(err);

		if (err instanceof AppError) return next(err);

		// Prisma duplicate error fallback
		if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
			return next(new AppError('EMAIL ALREADY IN USE!', 400, 'EMAIL', 'ERR_EMAIL_IN_USE'));
		}

		return next(new AppError('UNEXPECTED ERROR IN REGISTER FUNCTION!', 500, 'REGISTER', 'ERR_REGISTER_FAILED'));
	}
});
