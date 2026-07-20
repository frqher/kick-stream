import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import type { Request } from 'express'

export const UserAgent = createParamDecorator(
	(data: unknown, ctx: ExecutionContext) => {
		if (ctx.getType() === 'http') {
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
			const request = ctx.switchToHttp().getRequest() as Request

			return request.headers['user-agent']
		} else {
			const context = GqlExecutionContext.create(ctx)
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			return context.getContext().req.headers['user-agent'] as string
		}
	}
)
