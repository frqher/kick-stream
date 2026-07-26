import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/core/prisma/prisma.service'

@Injectable()
export class CategoryService {
	public constructor(private readonly prismaService: PrismaService) {}

	public async findAll() {
		const categories = await this.prismaService.category.findMany({
			orderBy: {
				createdAt: 'desc'
			}
		})
		return categories
	}

	public async findRandom() {
		const total = await this.prismaService.category.count()

		const randomIndexes = new Set<number>()

		while (randomIndexes.size < 4 && randomIndexes.size < total) {
			const randomIndex = Math.floor(Math.random() * total)

			randomIndexes.add(randomIndex)
		}

		const randoms = Array.from(randomIndexes).map(index =>
			this.prismaService.category.findFirst({
				skip: index
			})
		)

		const categories = await Promise.all(randoms)

		return categories
	}

	public async findBySlug(slug: string) {
		const category = await this.prismaService.category.findUnique({
			where: {
				slug
			},
			include: {
				streams: {
					include: {
						user: true,
						category: true
					}
				}
			}
		})

		if (!category) {
			throw new NotFoundException('Category not found')
		}

		return category
	}
}
