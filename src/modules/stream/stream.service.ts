import { Injectable } from '@nestjs/common'
import type { Prisma, User } from '@prisma/client'
import { type FileUpload } from 'graphql-upload/processRequest.js'
import Upload from 'graphql-upload/Upload.js'
import sharp from 'sharp'
import { PrismaService } from 'src/core/prisma/prisma.service'

import { StorageService } from '../libs/storage/storage.service'

import { ChangeStreamInfoInput } from './inputs/change-stream.info.input'
import { FiltersInput } from './inputs/filters.input'

@Injectable()
export class StreamService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly storageService: StorageService
	) {}

	public async findAll(input: FiltersInput = {}) {
		const { take, skip, searchTerm } = input

		const whereClause = searchTerm
			? this.findBySearchTermFilter(searchTerm)
			: undefined

		const streams = await this.prismaService.stream.findMany({
			take: take ?? 12,
			skip: skip ?? 0,
			where: {
				user: {
					isDeactivated: false
				},
				...whereClause
			},
			include: {
				user: true
			},
			orderBy: {
				createdAt: 'desc'
			}
		})

		return streams
	}

	public async findRandom() {
		const total = await this.prismaService.stream.count({
			where: {
				user: {
					isDeactivated: false
				}
			}
		})

		const randomIndexes = new Set<number>()

		while (randomIndexes.size < 4 && randomIndexes.size < total) {
			const randomIndex = Math.floor(Math.random() * total)

			randomIndexes.add(randomIndex)
		}

		const randoms = Array.from(randomIndexes).map(index =>
			this.prismaService.stream.findFirst({
				where: { user: { isDeactivated: false } },
				include: { user: true },
				skip: index
			})
		)

		const streams = await Promise.all(randoms)

		return streams
	}

	public async changeInfo(user: User, input: ChangeStreamInfoInput) {
		const { title } = input

		await this.prismaService.stream.update({
			where: {
				userId: user.id
			},
			data: {
				title
			}
		})

		return true
	}

	public async changeThumbnail(user: User, upload: Upload) {
		const stream = await this.findByUserId(user)
		if (stream?.thumbnailUrl) {
			await this.storageService.remove(stream?.thumbnailUrl)
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

		const fileName = `/streams/${user.username}.webp`

		const isGif =
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			file.filename && file.filename.endsWith('.gif') ? true : false
		const processedBuffer = await sharp(buffer, { animated: isGif })
			.resize(1280, 720)
			.webp()
			.toBuffer()

		await this.storageService.upload(
			processedBuffer,
			fileName,
			'image/webp'
		)

		await this.prismaService.stream.update({
			where: {
				userId: user.id
			},
			data: {
				thumbnailUrl: fileName
			}
		})

		return true
	}

	public async findByUserId(user: User) {
		const stream = await this.prismaService.stream.findUnique({
			where: {
				userId: user.id
			}
		})

		return stream
	}

	public async removeThumbnail(user: User) {
		const stream = await this.findByUserId(user)

		if (!stream?.thumbnailUrl) {
			return
		}

		await this.storageService.remove(stream?.thumbnailUrl)

		await this.prismaService.stream.update({
			where: {
				userId: user.id
			},
			data: {
				thumbnailUrl: null
			}
		})

		return true
	}

	private findBySearchTermFilter(
		searchTerm: string
	): Prisma.StreamWhereInput {
		return {
			OR: [
				{
					title: {
						contains: searchTerm,
						mode: 'insensitive'
					},
					user: {
						username: {
							contains: searchTerm,
							mode: 'insensitive'
						}
					}
				}
			]
		}
	}
}
