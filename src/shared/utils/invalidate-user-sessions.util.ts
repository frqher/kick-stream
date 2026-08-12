import { ConfigService } from '@nestjs/config'
import { RedisService } from 'src/core/redis/redis.service'

export async function invalidateUserSessions(
	redisService: RedisService,
	configService: ConfigService,
	userId: string
) {
	const folder = configService.getOrThrow<string>('SESSION_FOLDER')
	const stream = redisService.scanStream({
		match: `${folder}*`,
		count: 100
	})

	for await (const batch of stream) {
		const keys = batch as string[]
		if (keys.length === 0) continue

		const values = await redisService.mget(keys)
		const keysToDelete = values.flatMap((sessionData, index) => {
			if (!sessionData) return []

			try {
				const session = JSON.parse(sessionData) as { userId?: string }
				return session.userId === userId ? [keys[index]] : []
			} catch {
				return []
			}
		})

		if (keysToDelete.length > 0) {
			await redisService.del(...keysToDelete)
		}
	}
}
