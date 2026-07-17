import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import cookieParser from 'cookie-parser'
import session from 'express-session'

import { RedisStore } from './../node_modules/connect-redis/index'
import { CoreModule } from './core.module'
import { RedisService } from './core/redis/redis.service'
import { parseBoolean } from './shared/utils/parse-boolean'

async function bootstrap() {
	const app = await NestFactory.create(CoreModule)

	const config = app.get(ConfigService)
	const redis = app.get(RedisService)

	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	app.use(cookieParser(config.getOrThrow<string>('COOKIES_SECRET')))

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true
		})
	)

	app.use(
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		session({
			secret: config.getOrThrow<string>('SESSION_SECRET'),
			name: config.getOrThrow<string>('SESSION_NAME'),
			resave: false,
			saveUninitialized: false,
			cookie: {
				domain: config.getOrThrow<string>('SESSION_DOMAIN'),
				httpOnly: parseBoolean(
					config.getOrThrow<string>('SESSION_HTTP_ONLY')
				),
				sameSite: 'lax',
				secure: parseBoolean(
					config.getOrThrow<string>('SESSION_SECURE')
				),
				maxAge: 60 * 60 * 24 * 7 // 7 days
			},
			store: new RedisStore({
				client: redis,
				prefix: config.getOrThrow<string>('SESSION_FOLDER')
			})
		})
	)

	app.enableCors({
		origin: [config.getOrThrow<string>('ALLOWED_ORIGIN')],
		credentials: true,
		exposedHeaders: ['set-cookie']
	})

	await app.listen(config.getOrThrow<number>('APPLICATION_PORT'))
}
void bootstrap()
