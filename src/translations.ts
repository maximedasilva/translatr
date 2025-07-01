import path from 'path';
import * as vscode from 'vscode';
import fs from 'fs';
import loader from './loader';
declare interface LanguageType {
  name: string;
  path: string;
  requires?: Array<{ importName: string, importInfos: Object }>;
}

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

  constructor (translatrConfigFilePath = null) {
    this.#loader = loader.load;
    this.#translatrConfigFile = this.#loader(path.join(
      translatrConfigFilePath ||
      vscode.workspace.workspaceFolders[0].uri.fsPath,
      '.vscode', 'translatr.config.js'
    ));
  }

  updateTranslatrConfigFile(translatrConfigFilePath?: string) {
    this.#translatrConfigFile = this.#loader(path.join(
      translatrConfigFilePath ||
      vscode.workspace.workspaceFolders[0].uri.fsPath,
      '.vscode', 'translatr.config.js'
    ));
  }

  getLangPath (locale: string) {
    return path.join(
      vscode.workspace.workspaceFolders[0].uri.fsPath,
      this.getLocales().find((lang: LanguageType) => lang.name === locale)?.path
    );
  }

  getProperty(
    obj: TranslationObject,
    path: Array<string>
  ): string | TranslationObject {
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

  loadLanguages() {
    this.#translatrConfigFile?.languages.map((lang: LanguageType) => {
      this.#loadLanguage(lang);
    });
  }

  #loadLanguage(lang: LanguageType) {
    const localePath = path.join(
      vscode.workspace.workspaceFolders[0].uri.fsPath,
      lang.path
    );
    const isDirectory = fs.lstatSync(localePath).isDirectory();
    if (!isDirectory) {
      const fileContent = this.#loader(localePath, lang.requires);

      if(!this.#translations[lang.name]) {
        this.#translations[lang.name] = {};
      }

      this.#translations[lang.name] = fileContent;
    } else {
      fs.readdirSync(localePath).map((file: string) => {
        const filePath = path.join(localePath, file);
        const fileContent = this.#loader(filePath, lang.requires);
        const fileName = file.split('.')[0];
  
        if(!this.#translations[lang.name]) {
          this.#translations[lang.name] = {};
        }
  
        this.#translations[lang.name][fileName] = fileContent;
      });
    }
  }

  getTranslations(lang?: string) {
    if(lang) {
      return this.#translations[lang];
    }
    return this.#translations;
  }

  getTranslation(textKey: string) {
    const textKeyArray: Array<string> = textKey.split('.');
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