import { I18nextJsonMergePatch } from './types.js';

export function generateSchemaFromObject(obj: I18nextJsonMergePatch): any {
	const schema: any = {
		type: 'object',
		properties: {},
		required: [],
		additionalProperties: false,
	};

	for (const [key, value] of Object.entries(obj)) {
		schema.required.push(key);
		if (value === null) {
			schema.properties[key] = { type: 'null' };
		} else if (typeof value === 'string') {
			schema.properties[key] = { type: 'string' };
		} else if (Array.isArray(value)) {
			schema.properties[key] = {
				type: 'array',
				items: { type: 'string' },
			};
		} else if (typeof value === 'object') {
			schema.properties[key] = generateSchemaFromObject(value as I18nextJsonMergePatch);
		}
	}

	return schema;
}
