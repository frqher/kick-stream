import { BadRequestException, Logger } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { Prisma, PrismaClient } from '@prisma/client'
import { hash } from 'argon2'
import 'dotenv/config'
import { Pool } from 'pg'

import { CATEGORIES_DATA } from './data/categories.data'
import { STREAM_TITLES_DATA } from './data/stream.data'
import { USERNAME_DATA } from './data/users.data'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({
	adapter,
	transactionOptions: {
		maxWait: 5000,
		timeout: 10000,
		isolationLevel: Prisma.TransactionIsolationLevel.Serializable
	}
})

async function main() {
	try {
		Logger.log('Seeding started')

		await prisma.$transaction([
			prisma.user.deleteMany(),
			prisma.socialLink.deleteMany(),
			prisma.stream.deleteMany(),
			prisma.category.deleteMany()
		])

		await prisma.category.createMany({
			data: CATEGORIES_DATA
		})

		const categories = await prisma.category.findMany()

		const categoriesBySlug = Object.fromEntries(
			categories.map(category => [category.slug, category])
		)

		await prisma.$transaction(async tx => {
			for (const username of USERNAME_DATA) {
				const randomCategory =
					categoriesBySlug[
						Object.keys(categoriesBySlug)[
							Math.floor(
								Math.random() *
									Object.keys(categoriesBySlug).length
							)
						]
					]

				const userExists = await tx.user.findUnique({
					where: { username }
				})

				if (!userExists) {
					const createdUser = await tx.user.create({
						data: {
							email: `${username}@ruslandev.com`,
							password: await hash('12345678'),
							username,
							displayName: username,
							avatar: `/channels/${username}.webp`,
							isEmailVerified: true,
							socialLinks: {
								createMany: {
									data: [
										{
											title: 'Youtube',
											url: `https://youtube.com/${username}`,
											position: 1
										},
										{
											title: 'X',
											url: `https://x.com/${username}`,
											position: 2
										},
										{
											title: 'Instagram',
											url: `https://instagram.com/${username}`,
											position: 3
										},
										{
											title: 'TikTok',
											url: `https://tiktok.com/${username}`,
											position: 4
										},
										{
											title: 'Github',
											url: `https://github.com/${username}`,
											position: 5
										}
									]
								}
							},
							notificationSettings: {
								create: {}
							}
						}
					})

					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const randomTitles = STREAM_TITLES_DATA[randomCategory.slug]

					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const randomTitle =
						randomTitles[
							// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
							Math.floor(Math.random() * randomTitles.length)
						]

					await tx.stream.create({
						data: {
							// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
							title: randomTitle,
							thumbnailUrl: `/streams/${createdUser.username}.webp`,
							user: {
								connect: {
									id: createdUser.id
								}
							},
							category: {
								connect: {
									id: randomCategory.id
								}
							}
						}
					})

					Logger.log(
						`Created user ${createdUser.username} and stream ${randomTitle}`
					)
				}
			}
		})

		Logger.log('Seeding completed')
	} catch (error) {
		Logger.error(error)
		throw new BadRequestException('Seeding failed')
	} finally {
		await prisma.$disconnect()
		Logger.log('Prisma disconnected')
		process.exit(0)
	}
}

void main()
