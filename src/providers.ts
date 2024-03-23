import parseFile from "./parser";
import * as vscode from 'vscode';
import Translations, { TranslationObject } from "./translations";

const hoverProvider = (
  translatr: Translations,
  document: vscode.TextDocument,
  position: vscode.Position
) => {
  const textKey = parseFile(document, position);
  if(textKey) {
    const value: Array<{ locale: string, value: string | TranslationObject}> = translatr.getTranslation(textKey);
    if(value.length > 0) {
        const translations = value.map(translation => {
          const commandUri = vscode.Uri.parse(
            `command:translatr.goto?${encodeURIComponent(
              JSON.stringify({ locale: translation.locale, textKey })
            )}`
          );
          return `[Locale: ${translation.locale}, Value: ${translation.value}](${commandUri})`;
        }).join('\n\n');
        const md = new vscode.MarkdownString();
        md.isTrusted = true; // Allow commands to be executed
        md.appendMarkdown(`📁 Translatr\n\n${translations}`);
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

export { hoverProvider, provideLoadingCommand };