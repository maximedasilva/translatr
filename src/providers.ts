import * as parser from '@babel/parser';
import * as vscode from 'vscode';
import path from 'path';
import generate from '@babel/generator';
import fs from 'fs';
import Translations, { TranslationObject } from "./translations";
import { parseFile, generateFullPath, findNode } from "./parser";
import prettier from 'prettier';
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
  
  
  const { start, end } = findNode(ast, textKey);
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

const providenewTranslation = async(translatr: Translations) => {
  try {
    const textKey = await vscode.window.showInputBox({
      prompt: 'Enter the text key for the new translation',
      placeHolder: 'common.hello'
    });
  
    const document = await vscode.workspace.openTextDocument(
      path.join(translatr.getLangPath('en'), //TODO juste a placeholder
      textKey.split('.')[0]+'.js')
    );
    console.log(document);
    const content = document.getText();
    const ast = parser.parse(content, { sourceType: 'module' });
  
    if(textKey === undefined) {
      return;
    }
  
    console.log(generateFullPath(ast, textKey));

    const output = generate(ast, { decoratorsBeforeExport: true, jsescOption: {json: true, quotes: 'single', es6: false },  } , generateFullPath(ast, textKey));
    const formattedCode = await prettier.format(output.code, { parser: 'typescript', singleQuote: true });

    console.log(output);
    fs.writeFileSync(path.join(translatr.getLangPath('en'),textKey.split('.')[0]+'.js'), formattedCode);
    vscode.window.showInformationMessage(`new translation added: ${textKey}`);
  } catch(e) {
    console.log(e);
  }
};

export {
  hoverProvider,
  provideLoadingCommand,
  provideGoto,
  providenewTranslation
};