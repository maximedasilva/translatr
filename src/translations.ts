import path from 'path';
import * as vscode from 'vscode';
import loader from './loader';
import fs from 'fs';

declare interface LanguageType {
	name: string;
	path: string;
};
export declare type TranslationObject = {
	[_: string]: string | TranslationObject
};
declare interface tranltrConfigType {
	languages: Array<LanguageType>;
}
class Translations {
	#translatrConfigFile: tranltrConfigType = null;
	#loader = null;
	#translations = {};

	getProperty(obj: TranslationObject, path: Array<string>): string | TranslationObject {
		let current = obj;
	
		for (let i = 0; i < path.length; i++) {
				if (current[path[i]] === undefined) {
						return undefined;
				} else {
						current = current[path[i]] as TranslationObject;
				}
		}
	
		return current;
	}

	loadLanguage(lang: LanguageType) {
		const localePath = path.join(
			vscode.workspace.workspaceFolders[0].uri.fsPath, 
			lang.path
		);
		fs.readdirSync(localePath).map((file: string) => {
			console.log(localePath, file);
			const filePath = path.join(localePath, file);
			const fileContent = this.#loader(filePath);
			const fileName = file.split('.')[0];
			if(!this.#translations[lang.name]) {
				this.#translations[lang.name] = {};
			}
			
			this.#translations[lang.name][fileName] = fileContent;
		});
	}

	constructor (loader, translatrConfigFilePath = null) {
		this.#loader = loader;
		this.#translatrConfigFile = this.#loader(path.join(
			translatrConfigFilePath || 
			vscode.workspace.workspaceFolders[0].uri.fsPath, '.vscode', 'translatr.config.js'
		));
		this.#translatrConfigFile?.languages.map((lang: LanguageType) => {
			this.loadLanguage(lang);
		});
	}

	getTranslations(lang?: string) {
		if(lang) {
			return this.#translations[lang];
		}
		return this.#translations;
	}

	getTranslation(textKey: string) {
		let textKeyArray: any = textKey.split('.');
		const translations = this.getLocales().map((locale: LanguageType) => {
			const value = this.getProperty(this.getTranslations(locale.name), textKeyArray);
			if(value) {
				return { locale: locale.name, value:value };
			}
		});
			return translations.filter(
				(translation: any) => translation !== undefined
			);
	}

	getLocales() {
		return this.#translatrConfigFile.languages;
	}

}
export default Translations;