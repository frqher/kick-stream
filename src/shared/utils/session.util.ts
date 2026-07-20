import { InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { User } from '@prisma/client'
import type { Request } from 'express'

import { SessionMetadata } from '../types/session-metadata.types'

export function saveSession(
	req: Request,
	user: User,
	metadata: SessionMetadata
) {
	return new Promise((resolve, reject) => {
		req.session.createdAt = new Date()
		req.session.userId = user.id
		req.session.metadata = metadata

		req.session.save(err => {
			if (err) {
				console.log(err)
				return reject(
					new InternalServerErrorException(
						'Something went wrong. Please try again later.'
					)
				)
			}

			resolve(user)
		})
	})
}

export function destroySession(req: Request, configService: ConfigService) {
	return new Promise((resolve, reject) => {
		req.session.destroy(err => {
			if (err) {
				return reject(
					new InternalServerErrorException(
						'Something went wrong. Please try again later.'
					)
				)
			}

			req.res?.clearCookie(
				configService.getOrThrow<string>('SESSION_NAME')
			)
			resolve(true)
		})
	})
}
