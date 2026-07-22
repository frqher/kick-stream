import { ConflictException, Injectable } from '@nestjs/common'
import { type User } from '@prisma/client'
import { type FileUpload } from 'graphql-upload/processRequest.js'
import Upload from 'graphql-upload/Upload.js'
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

	public async changeAvatar(user: User, upload: Upload) {
		if (user.avatar) {
			await this.storageService.remove(user.avatar)
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		const file: FileUpload = await upload.promise

		const chunks: Buffer[] = []

		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		for await (const chunk of file.createReadStream()) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			chunks.push(chunk)
		}

		const buffer = Buffer.concat(chunks)

		const fileName = `/channels/${user.username}.webp`

		const isGif =
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
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

	public async reorderSocialLinks(list: SocialLinkOrderInput[]) {
		if (!list.length) {
			return
		}

		const updatePromises = list.map(async socialLink => {
			return this.prismaService.socialLink.update({
				where: {
					id: socialLink.id
				},
				data: {
					position: socialLink.position
				}
			})
		})

		await Promise.all(updatePromises)

		return true
	}

	public async updateSocialLink(id: string, input: SocialLinkInput) {
		const { title, url } = input

		await this.prismaService.socialLink.update({
			where: {
				id
			},
			data: {
				title,
				url
			}
		})

		return true
	}

	public async reorderSocialLink(id: string) {
		await this.prismaService.socialLink.delete({
			where: {
				id
			}
		})

		return true
	}
}
