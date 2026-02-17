// src/webhooks/security/githubSignatureRequired.js
import createHmacSignatureRequired from './signatureRequired.js';

export default createHmacSignatureRequired({
	headerName: 'X-Hub-Signature-256',
	secretEnv: 'WEBHOOK_SECRET',
	parseSignature: (v) => v.replace('sha256=', '')
});
