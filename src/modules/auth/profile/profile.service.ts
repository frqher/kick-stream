import {
	ConflictException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { type User } from '@prisma/client'
import { type FileUpload } from 'graphql-upload/processRequest.mjs'
import sharp from 'sharp'
import { PrismaService } from 'src/core/prisma/prisma.service'
import { StorageService } from 'src/modules/libs/storage/storage.service'

import { ChangeProfileInfoInput } from './inputs/change-profile-info.input'
import {
	SocialLinkInput,
	SocialLinkOrderInput
} from './inputs/social-link.input'

@Injectable()
export class ProfileService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly storageService: StorageService
	) {}

	public async changeAvatar(user: User, upload: Promise<FileUpload>) {
		if (user.avatar) {
			await this.storageService.remove(user.avatar)
		}

		const file = await upload

		const chunks: Buffer[] = []

		for await (const chunk of file.createReadStream()) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			chunks.push(chunk)
		}

		const buffer = Buffer.concat(chunks)

		const fileName = `/channels/${user.username}.webp`

		const isGif =
			file.filename && file.filename.endsWith('.gif') ? true : false
		const processedBuffer = await sharp(buffer, { animated: isGif })
			.resize(512, 512)
			.webp()
			.toBuffer()

		await this.storageService.upload(
			processedBuffer,
			fileName,
			'image/webp'
		)

		await this.prismaService.user.update({
			where: {
				id: user.id
			},
			data: {
				avatar: fileName
			}
		})

		return true
	}

	public async removeAvatar(user: User) {
		if (!user.avatar) {
			return
		}

		await this.storageService.remove(user.avatar)

		await this.prismaService.user.update({
			where: {
				id: user.id
			},
			data: {
				avatar: null
			}
		})

		return true
	}

	public async changeInfo(user: User, input: ChangeProfileInfoInput) {
		const { username, displayName, bio } = input

		const usernameExist = await this.prismaService.user.findUnique({
			where: {
				username
			}
		})

		if (usernameExist && username !== user.username) {
			throw new ConflictException('Username already exist')
		}

		await this.prismaService.user.update({
			where: {
				id: user.id
			},
			data: {
				username,
				displayName,
				bio
			}
		})

		return true
	}

	public async findSocialLinks(user: User) {
		const socialLinks = await this.prismaService.socialLink.findMany({
			where: {
				userId: user.id
			},
			orderBy: {
				position: 'asc'
			}
		})

		return socialLinks
	}

	public async createSocialLink(user: User, input: SocialLinkInput) {
		const { title, url } = input

		const lastSocialLink = await this.prismaService.socialLink.findFirst({
			where: {
				userId: user.id
			},
			orderBy: {
				position: 'desc'
			}
		})

		const newPosition = lastSocialLink?.position
			? lastSocialLink.position + 1
			: 1

		await this.prismaService.socialLink.create({
			data: {
				title,
				url,
				position: newPosition,
				user: {
					connect: {
						id: user.id
					}
				}
			}
		})

		return true
	}

	public async reorderSocialLinks(user: User, list: SocialLinkOrderInput[]) {
		if (!list.length) {
			return true
		}

		const uniqueIds = [...new Set(list.map(socialLink => socialLink.id))]
		const ownedLinks = await this.prismaService.socialLink.count({
			where: { id: { in: uniqueIds }, userId: user.id }
		})

		if (ownedLinks !== uniqueIds.length) {
			throw new NotFoundException('Social link not found')
		}

		const updatePromises = list.map(socialLink => {
			return this.prismaService.socialLink.update({
				where: { id: socialLink.id },
				data: {
					position: socialLink.position
				}
			})
		})

		await this.prismaService.$transaction(updatePromises)

		return true
	}

	public async updateSocialLink(
		user: User,
		id: string,
		input: SocialLinkInput
	) {
		const { title, url } = input

		const result = await this.prismaService.socialLink.updateMany({
			where: { id, userId: user.id },
			data: {
				title,
				url
			}
		})

		if (result.count === 0) {
			throw new NotFoundException('Social link not found')
		}

		return true
	}

	public async removeSocialLink(user: User, id: string) {
		const result = await this.prismaService.socialLink.deleteMany({
			where: { id, userId: user.id }
		})

		if (result.count === 0) {
			throw new NotFoundException('Social link not found')
		}

		return true
	}
}
