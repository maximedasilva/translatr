import * as parser from '@babel/parser';
import * as vscode from 'vscode';
import path from 'path';

import Translations, { TranslationObject } from "./translations";
import { parseFile, generateFullPath } from "./parser";

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
  const document = await vscode.workspace.openTextDocument(
    path.join(translatr.getLangPath(locale),
    textKey.split('.')[0]+'.js')
  );

  const content = document.getText();
  const ast = parser.parse(content, { sourceType: 'module' });
  
  
  const { start, end } = generateFullPath(ast, textKey);
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