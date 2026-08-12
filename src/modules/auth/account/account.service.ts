import {
	ConflictException,
	Injectable,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { type User } from '@prisma/client'
import { hash, verify } from 'argon2'
import { PrismaService } from 'src/core/prisma/prisma.service'
import { RedisService } from 'src/core/redis/redis.service'
import { invalidateUserSessions } from 'src/shared/utils/invalidate-user-sessions.util'

import { VerificationService } from '../verification/verification.service'

import { ChangeEmailInput } from './input/change-email.input'
import { ChangePasswordInput } from './input/change-password.input'
import { CreateUserInput } from './input/create-user.input'

@Injectable()
export class AccountService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly verificationService: VerificationService,
		private readonly redisService: RedisService,
		private readonly configService: ConfigService
	) {}

	public async me(id: string) {
		const user = await this.prismaService.user.findUnique({
			where: { id },
			include: {
				socialLinks: true
			}
		})

		if (!user) {
			throw new NotFoundException('User not found')
		}

		return user
	}

	public async findAll() {
		const users = await this.prismaService.user.findMany()

		return users
	}

	public async create(input: CreateUserInput) {
		const { username, email, password } = input

		const isUsernameExist = await this.prismaService.user.findUnique({
			where: { username }
		})

		if (isUsernameExist) {
			throw new ConflictException('Username already exist')
		}

		const isEmailExist = await this.prismaService.user.findUnique({
			where: { email }
		})

		if (isEmailExist) {
			throw new ConflictException('Email already exist')
		}

		const user = await this.prismaService.user.create({
			data: {
				username,
				email,
				password: await hash(password),
				displayName: username,
				stream: {
					create: {
						title: `${username} streaming!`
					}
				}
			}
		})

		await this.verificationService.sendVerificationToken(user)

		return true
	}

	public async changeEmail(user: User, input: ChangeEmailInput) {
		const { email, password } = input

		if (!(await verify(user.password, password))) {
			throw new UnauthorizedException('Invalid credentials')
		}

		const emailOwner = await this.prismaService.user.findUnique({
			where: { email },
			select: { id: true }
		})

		if (emailOwner && emailOwner.id !== user.id) {
			throw new ConflictException('Email already exists')
		}

		const updatedUser = await this.prismaService.user.update({
			where: {
				id: user.id
			},
			data: {
				email,
				isEmailVerified: false
			}
		})

		await this.verificationService.sendVerificationToken(updatedUser)

		await invalidateUserSessions(
			this.redisService,
			this.configService,
			user.id
		)

		return true
	}

	public async changePassword(user: User, input: ChangePasswordInput) {
		const { oldPassword, newPassword } = input

		const isValidPassword = await verify(user.password, oldPassword)

		if (!isValidPassword) {
			throw new UnauthorizedException('Incorrect old password')
		}

		if (oldPassword === newPassword) {
			throw new ConflictException(
				'New password is the same as old password'
			)
		}

		await this.prismaService.user.update({
			where: {
				id: user.id
			},
			data: {
				password: await hash(newPassword)
			}
		})

		await invalidateUserSessions(
			this.redisService,
			this.configService,
			user.id
		)

		return true
	}
}
