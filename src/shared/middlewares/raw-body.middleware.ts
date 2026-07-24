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

		getRawBody(req, { encoding: 'utf-8' })
			.then(rawBody => {
				req.body = rawBody
				next()
			})
			.catch(err => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				throw new BadRequestException('Internal server error', err)
			})
	}
}
