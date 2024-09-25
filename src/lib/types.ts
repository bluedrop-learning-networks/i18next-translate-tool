export interface I18nextJson {
	[key: string]: string | string[] | I18nextJson;
}

export interface I18nextJsonMergePatch {
	[key: string]: string | string[] | null | I18nextJsonMergePatch;
}
