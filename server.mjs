import { createRequestHandler } from '@remix-run/express';
import { broadcastDevReady } from '@remix-run/node';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
// notice that the result of `remix build` is "just a module"
import * as build from './build/index.js';
import process from 'process';

const app = express();
app.use(express.static('public'));
// and your app is "just a request handler"

// const maxMultiple = process.env.NODE_ENV === 'test' ? 100 : 1;
const maxMultiple = 1;
const rateLimitDefault = {
	windowMs: 60 * 1000, // 1 minute
	limit: 1000 * maxMultiple, // limit each IP to 100 requests per windowMs
	standardHeaders: true,
	legacyHeaders: false,
};

const generalRateLimit = rateLimit(rateLimitDefault);
const strongRateLimit = rateLimit({ ...rateLimitDefault, limit: 100 * maxMultiple });
const strongestRateLimit = rateLimit({ ...rateLimitDefault, limit: 3 * maxMultiple });

app.use((req, res, next) => {
	const strongPaths = ['login', 'signup']; // Add paths that should have a stronger rate limit
	if (req.method !== 'GET' && req.method !== 'HEAD') {
		if (strongPaths.some(path => req.path.includes(path))) {
			return strongestRateLimit(req, res, next);
		}
		return strongRateLimit(req, res, next);
	}
	return generalRateLimit(req, res, next);
});

app.all('*', createRequestHandler({ build }));

app.listen(3000, () => {
	if (process.env.NODE_ENV === 'development') {
		broadcastDevReady(build);
	}
	console.log('App listening on http://localhost:3000');
});
