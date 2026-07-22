import {
	BadRequestException,
	Injectable,
	type PipeTransform
} from '@nestjs/common'
import { ReadStream } from 'fs'

import { validatefileFormat, validateFileSize } from '../utils/file.util'

@Injectable()
export class FileValidationPipe implements PipeTransform {
	public async transform(value: any) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		if (!value.filename) {
			throw new BadRequestException('File is required')
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { filename, createReadStream } = value

		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const fileStream = createReadStream() as ReadStream

		const allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif']

		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const isFileFormatValid = validatefileFormat(filename, allowedFormats)

		if (!isFileFormatValid) {
			throw new BadRequestException(
				`Invalid file format. Allowed formats: ${allowedFormats.join(', ')}`
			)
		}

		const isFileSizeValid = await validateFileSize(
			fileStream,
			10 * 1024 * 1024
		)

		if (!isFileSizeValid) {
			throw new BadRequestException('File size must be less than 10MB')
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return value
	}
}
