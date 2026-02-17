// src/app.js
import express from 'express';
import cors from 'cors';

// Middlewares globais
import successHandler from '../middlewares/successHandler.js';
import errorHandler from '../middlewares/errorHandler.js';

// Auth routes
import { router as registerRoute } from './auth/routes/registerRoute.js';
import { router as loginRoute } from './auth/routes/loginRoute.js';
import { router as logoutRoute } from './auth/routes/logoutRoute.js';
import { router as getMeRoute } from './auth/routes/getMeRoute.js';

// User routes (STAFF / gerais)
import { router as listUsersRoute } from './users/listUsersRoute.js';
import { router as emailCheckRoute } from './users/emailCheckRoute.js';
import { router as updateUserStaffRoute } from './users/staffRoutes/updateUserStaff.js';
import { router as deleteUserStaffRoute } from './users/staffRoutes/deleteUserStaff.js';

// Admin routes
import { router as adminUpdateAllStaffRoute } from './users/adminRoutes/adminUpdateAllStaffRoute.js';
import { router as adminDeleteAllStaffRoute } from './users/adminRoutes/adminDeleteAllStaffRoute.js';

//Webhopoks routes
import { router as githubWebhookRoute } from './webhook/routes/githubWebhookRoute.js';
import { router as listWebhookEventsRoute } from './webhook/routes/listWebhookEventsRoute.js';

const app = express();

// Basic Middlewares
app.use(cors());
app.use(
	express.json({
		verify: (req, res, buf, encoding) => {
			req.rawBody = buf.toString(encoding || 'utf8');
		}
	})
);

// Add res.success in all routes
app.use(successHandler);

// 🔐 Auth Routes
app.use('/', registerRoute);
app.use('/', loginRoute);
app.use('/', logoutRoute);
app.use('/', getMeRoute);

// 👥 User Routes (self / gerais / helpers)
app.use('/', listUsersRoute);
app.use('/', emailCheckRoute);

app.use('/', updateUserStaffRoute);
app.use('/', deleteUserStaffRoute);

// 🛡️ ADMIN Routes (RBAC completo)
app.use('/', adminUpdateAllStaffRoute);
app.use('/', adminDeleteAllStaffRoute);

// WEBHOOKS:
app.use('/', githubWebhookRoute);
app.use('/', listWebhookEventsRoute);

// GLOBAL ERROR MIDDLEWARE
app.use(errorHandler);

export default app;
