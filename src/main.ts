import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { RedisStore } from 'connect-redis'
import cookieParser from 'cookie-parser'
import session from 'express-session'

import { CoreModule } from './core.module'
import { RedisService } from './core/redis/redis.service'
import { parseBoolean } from './shared/utils/parse-boolean'

async function bootstrap() {
	const app = await NestFactory.create(CoreModule, { rawBody: true })

	const config = app.get(ConfigService)
	const redis = app.get(RedisService)
	const { default: graphqlUploadExpress } =
		await import('graphql-upload/graphqlUploadExpress.mjs')

	app.use(cookieParser(config.getOrThrow<string>('COOKIES_SECRET')))
	app.use(
		config.getOrThrow<string>('GRAPHQL_PREFIX'),

		graphqlUploadExpress({ maxFileSize: 10 * 1024 * 1024, maxFiles: 1 })
	)

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
			forbidNonWhitelisted: true
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
