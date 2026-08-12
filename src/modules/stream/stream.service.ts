import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Prisma, User } from '@prisma/client'
import { randomUUID } from 'crypto'
import { type FileUpload } from 'graphql-upload/processRequest.mjs'
import { AccessToken } from 'livekit-server-sdk'
import sharp from 'sharp'
import { PrismaService } from 'src/core/prisma/prisma.service'

import { StorageService } from '../libs/storage/storage.service'

import { ChangeStreamInfoInput } from './inputs/change-stream.info.input'
import { FiltersInput } from './inputs/filters.input'
import { GenerateStreamTokenInput } from './inputs/generate-stream.-token.input'

@Injectable()
export class StreamService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly configService: ConfigService,
		private readonly storageService: StorageService
	) {}

	public async findAll(input: FiltersInput = {}) {
		const { take, skip, searchTerm } = input
		const normalizedSearchTerm = searchTerm?.trim()

		const whereClause = normalizedSearchTerm
			? this.findBySearchTermFilter(normalizedSearchTerm)
			: undefined

		const streams = await this.prismaService.stream.findMany({
			take: take ?? 12,
			skip: skip ?? 0,
			where: {
				user: {
					isDeactivated: false
				},
				isLive: true,
				...whereClause
			},
			include: {
				user: true,
				category: true
			},
			orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
		})

		return streams
	}

	public async findRandom() {
		const total = await this.prismaService.stream.count({
			where: {
				user: {
					isDeactivated: false
				},
				isLive: true
			}
		})

		const randomIndexes = new Set<number>()

		while (randomIndexes.size < 4 && randomIndexes.size < total) {
			const randomIndex = Math.floor(Math.random() * total)

			randomIndexes.add(randomIndex)
		}

		const randoms = Array.from(randomIndexes).map(index =>
			this.prismaService.stream.findFirst({
				where: {
					user: { isDeactivated: false },
					isLive: true
				},
				include: { user: true, category: true },
				orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
				skip: index
			})
		)

		const streams = await Promise.all(randoms)

		return Array.from(
			new Map(
				streams
					.filter(stream => stream !== null)
					.map(stream => [stream.id, stream])
			).values()
		)
	}

	public async changeInfo(user: User, input: ChangeStreamInfoInput) {
		const { title, categoryId } = input

		await this.prismaService.stream.update({
			where: {
				userId: user.id
			},
			data: {
				title,
				category: {
					connect: {
						id: categoryId
					}
				}
			}
		})

		return true
	}

	public async changeThumbnail(user: User, upload: Promise<FileUpload>) {
		const stream = await this.findByUserId(user)
		if (stream?.thumbnailUrl) {
			await this.storageService.remove(stream?.thumbnailUrl)
		}

		const file = await upload

		const chunks: Buffer[] = []

		for await (const chunk of file.createReadStream()) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			chunks.push(chunk)
		}

		const buffer = Buffer.concat(chunks)

		const fileName = `/streams/${user.username}.webp`

		const isGif =
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

	public async generateToken(
		sessionUserId: string | undefined,
		input: GenerateStreamTokenInput
	) {
		const { channelId } = input

		const user = sessionUserId
			? await this.prismaService.user.findUnique({
					where: { id: sessionUserId },
					select: { id: true, username: true, isDeactivated: true }
				})
			: null

		if (user?.isDeactivated) {
			throw new BadRequestException('Account is deactivated')
		}

		const viewer = user ?? {
			id: randomUUID(),
			username: 'Guest'
		}

		const channel = await this.prismaService.user.findUnique({
			where: {
				id: channelId
			},
			include: { stream: true }
		})

		if (!channel || channel.isDeactivated) {
			throw new NotFoundException('Channel not found')
		}

		if (!channel.stream?.isLive) {
			throw new BadRequestException('Channel is not live')
		}

		const token = new AccessToken(
			this.configService.getOrThrow<string>('LIVEKIT_API_KEY'),
			this.configService.getOrThrow<string>('LIVEKIT_API_SECRET'),
			{
				identity: `viewer-${viewer.id}`,
				name: viewer.username,
				ttl: '10m'
			}
		)

		token.addGrant({
			room: channel.id,
			roomJoin: true,
			canPublish: false,
			canPublishData: false,
			canSubscribe: true
		})

		return {
			token: token.toJwt()
		}
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
					}
				},
				{
					user: {
						username: {
							contains: searchTerm,
							mode: 'insensitive'
						}
					}
				},
				{
					user: {
						displayName: {
							contains: searchTerm,
							mode: 'insensitive'
						}
					}
				},
				{
					category: {
						title: {
							contains: searchTerm,
							mode: 'insensitive'
						}
					}
				}
			]
		}
	}
}
