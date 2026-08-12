import {
	BadRequestException,
	Injectable,
	type NestMiddleware
} from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'
import getRawBody from 'raw-body'

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
	public use(req: Request, res: Response, next: NextFunction) {
		if (!req.readable) {
			return next(new BadRequestException('Invalid requesrt'))
		}

		getRawBody(req, { encoding: 'utf-8', limit: '1mb' })
			.then(rawBody => {
				req.body = rawBody
				next()
			})
			.catch(() => {
				next(new BadRequestException('Invalid request body'))
			})
	}
}
