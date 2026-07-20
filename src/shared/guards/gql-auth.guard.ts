import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException
} from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import type { Request } from 'express'
import { PrismaService } from 'src/core/prisma/prisma.service'

@Injectable()
export class GqlAuthGuard implements CanActivate {
	public constructor(private readonly prismaService: PrismaService) {}

	public async canActivate(context: ExecutionContext): Promise<boolean> {
		const ctx = GqlExecutionContext.create(context)
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
		const request = ctx.getContext().req

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		if (typeof request.session.userId === 'undefined') {
			throw new UnauthorizedException('user not authenticated')
		}

		const user = await this.prismaService.user.findUnique({
			where: {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
				id: request.session.userId
			}
		})
		if (user === null) {
			throw new UnauthorizedException('user not authenticated')
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		request.user = user

		return true
	}
}
