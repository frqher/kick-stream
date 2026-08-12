import { BadRequestException, Injectable } from '@nestjs/common'
import { type User } from '@prisma/client'
import { verify } from 'argon2'
import { randomBytes } from 'crypto'
import { encode } from 'hi-base32'
import { TOTP } from 'otpauth'
import * as QRCode from 'qrcode'
import { PrismaService } from 'src/core/prisma/prisma.service'

import { DisableTotpInput } from './inputs/disable-totp.input'
import { EnableTotpInput } from './inputs/enable-totp.input'

@Injectable()
export class TotpService {
	public constructor(private readonly prismaService: PrismaService) {}

	public async generate(user: User) {
		const secret = encode(randomBytes(15))
			.replace(/=/g, '')
			.substring(0, 24)

		const totp = new TOTP({
			issuer: 'KickStream',
			label: `${user.email}`,
			algorithm: 'SHA1',
			digits: 6,
			secret
		})

		const otpauthUrl = totp.toString()

		const qrcodeUrl = await QRCode.toDataURL(otpauthUrl)

		return {
			qrcodeUrl,
			secret
		}
	}

	public async enable(user: User, input: EnableTotpInput) {
		const { password, secret, pin } = input

		if (!(await verify(user.password, password))) {
			throw new BadRequestException('Invalid credentials')
		}

		const totp = new TOTP({
			issuer: 'KickStream',
			label: `${user.email}`,
			algorithm: 'SHA1',
			digits: 6,
			secret
		})

		const delta = totp.validate({ token: pin })
		if (delta === null) {
			throw new BadRequestException('Invalid code')
		}

		await this.prismaService.user.update({
			where: {
				id: user.id
			},
			data: {
				totpSecret: secret,
				isTotpEnabled: true
			}
		})

		return true
	}

	public async disable(user: User, input: DisableTotpInput) {
		if (!user.isTotpEnabled || !user.totpSecret) {
			throw new BadRequestException(
				'Two-factor authentication is not enabled'
			)
		}

		if (!(await verify(user.password, input.password))) {
			throw new BadRequestException('Invalid credentials')
		}

		const totp = new TOTP({
			issuer: 'KickStream',
			label: `${user.email}`,
			algorithm: 'SHA1',
			digits: 6,
			secret: user.totpSecret
		})

		if (totp.validate({ token: input.pin }) === null) {
			throw new BadRequestException('Invalid code')
		}

		await this.prismaService.user.update({
			where: {
				id: user.id
			},
			data: {
				totpSecret: null,
				isTotpEnabled: false
			}
		})

		return true
	}
}
