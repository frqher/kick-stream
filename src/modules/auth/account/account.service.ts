import {
	ConflictException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { hash } from 'argon2'
import { PrismaService } from 'src/core/prisma/prisma.service'

import { CreateUserInput } from '../input/create-user.input'
import { VerificationService } from '../verification/verification.service'

@Injectable()
export class AccountService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly verificationService: VerificationService
	) {}

	public async me(id: string) {
		const user = await this.prismaService.user.findUnique({
			where: { id }
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
				displayName: username
			}
		})

		await this.verificationService.sendVerificationToken(user)

		return true
	}
}
