import { GraphQLError, GraphQLScalarType } from 'graphql'

type UploadValue = {
	promise: Promise<unknown>
}

export const GraphQLUpload = new GraphQLScalarType({
	name: 'Upload',
	description: 'The `Upload` scalar type represents a file upload.',
	parseValue(value: unknown) {
		if (
			typeof value === 'object' &&
			value !== null &&
			'promise' in value &&
			(value as UploadValue).promise instanceof Promise
		) {
			return (value as UploadValue).promise
		}

		throw new GraphQLError('Upload value invalid.')
	},
	parseLiteral(node) {
		throw new GraphQLError('Upload literal unsupported.', { nodes: node })
	},
	serialize() {
		throw new GraphQLError('Upload serialization unsupported.')
	}
})
