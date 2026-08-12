import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/core/prisma/prisma.service'

@Injectable()
export class CategoryService {
	public constructor(private readonly prismaService: PrismaService) {}

	public async findAll() {
		const categories = await this.prismaService.category.findMany({
			orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
		})
		return categories
	}

	public async findRandom() {
		const categories = await this.prismaService.category.findMany()

		for (let index = categories.length - 1; index > 0; index--) {
			const randomIndex = Math.floor(Math.random() * (index + 1))
			;[categories[index], categories[randomIndex]] = [
				categories[randomIndex],
				categories[index]
			]
		}

		return categories.slice(0, 10)
	}

	public async findBySlug(slug: string) {
		const category = await this.prismaService.category.findUnique({
			where: {
				slug
			}
		})

		if (!category) {
			throw new NotFoundException('Category not found')
		}

		return category
	}
}
