import parseFile from "./parser";
import * as vscode from 'vscode';
import Translations, { TranslationObject } from "./translations";
import path from 'path';

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
  value: string,
) => {
  const document = await vscode.workspace.openTextDocument(
    path.join(translatr.getLangPath(locale),
    textKey.split('.')[0]+'.js')
  );

  const content = document.getText();
  const lines = content.split('\n');
  const lineIndex = lines.findIndex(line => line.includes(value));
  
  vscode.window.showTextDocument(
    document, {
      preview: true,
      viewColumn: -2,
      preserveFocus: false,
      selection: lineIndex !== -1 ?
        new vscode.Range(lineIndex, 0, lineIndex, lines[lineIndex].length) :
        null
    }
  );
};


export { hoverProvider, provideLoadingCommand, provideGoto };