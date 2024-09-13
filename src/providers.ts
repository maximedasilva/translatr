import * as parser from '@babel/parser';
import * as vscode from 'vscode';
import * as fs from 'fs';
import path from 'path';

import Translations, { TranslationObject } from "./translations";
import { parseFile, generateFullPathJS, generateFullPathTS } from "./parser";

const hoverProvider = (
  translatr: Translations,
  document: vscode.TextDocument,
  position: vscode.Position
) => {
  const textKey = parseFile(document, position);
  if(textKey) {
    const value: Array<
      { locale: string, value: string | TranslationObject}
    > = translatr.getTranslation(textKey);
    if(value.length > 0) {
        const translations = value.map(translation => {
          const commandUri = vscode.Uri.parse(
            `command:translatr.goto?${encodeURIComponent(
              JSON.stringify({ locale: translation.locale, textKey, value: translation.value })
            )}`
          );
          return `[Locale: ${translation.locale}, Value: ${translation.value}](${commandUri})`;
        }).join('\n\n');
        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        md.appendMarkdown(`📁 Translatr\n\n${translations}`, );
        return new vscode.Hover(md);
    }
  } else {
      return undefined;
  }
};

const provideLoadingCommand = (translatr: Translations) => {
  translatr.loadLanguages();
  vscode.window.showInformationMessage('Languages reloaded!');
}; 

const provideGoto = async(
  translatr: Translations, 
  locale: string, 
  textKey: string,
) => {
  const isTs = fs.existsSync(
    path.join(translatr.getLangPath(locale), textKey.split('.')[0] + '.ts')
  );
  
  let filePath: string;

  // Check if the file exists
  if (isTs) {
    filePath = path.join(
      translatr.getLangPath(locale),
      textKey.split('.')[0] + '.ts'
    );
  } else {
    filePath = path.join(
      translatr.getLangPath(locale),
      textKey.split('.')[0] + '.js'
    );
  }

  const document = await vscode.workspace.openTextDocument(filePath);

  const content = document.getText();
  const ast = parser.parse(content, { sourceType: 'module' });
  const { start, end } = (isTs ? generateFullPathTS :generateFullPathJS)(ast, textKey);
  if (start !== undefined && end !== undefined) {
    const startPosition = document.positionAt(start);
    const endPosition = document.positionAt(end);
    const range = new vscode.Range(startPosition, endPosition);
    vscode.window.showTextDocument(document, {
      selection: range,
      viewColumn: -2
    });
  } else {
    vscode.window.showTextDocument(document, {
      viewColumn: -2
    });    
  }

};

export { hoverProvider, provideLoadingCommand, provideGoto };