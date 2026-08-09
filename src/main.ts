import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { RedisStore } from 'connect-redis'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js'

import { CoreModule } from './core.module'
import { RedisService } from './core/redis/redis.service'
import { parseBoolean } from './shared/utils/parse-boolean'

async function bootstrap() {
	const app = await NestFactory.create(CoreModule, { rawBody: true })

	const config = app.get(ConfigService)
	const redis = app.get(RedisService)

	app.use(cookieParser(config.getOrThrow<string>('COOKIES_SECRET')))
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	app.use(config.getOrThrow<string>('GRAPHQL_PREFIX'), graphqlUploadExpress())

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true
		})
	)

	app.use(
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
				maxAge: 1000 * 60 * 60 * 24 * 7
			},
			store: new RedisStore({
				client: redis,
				prefix: config.getOrThrow<string>('SESSION_FOLDER'),
				ttl: 60 * 60 * 24 * 7
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
