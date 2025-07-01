import * as vscode from 'vscode';
import Translations from './translations';
import { hoverProvider, provideGoto, provideLoadingCommand } from './providers';

export function activate(context: vscode.ExtensionContext) {
  let translatr: Translations;
  setImmediate(async() => {
    translatr = new Translations();
    translatr.loadLanguages();
  });
  const languageCommand = vscode.languages.registerHoverProvider(
    { scheme: 'file', language: '*' },
    {
      provideHover(document: vscode.TextDocument, position: vscode.Position) {
        return hoverProvider(translatr, document, position);
      }
    }
  );

  const loadingCommand = vscode.commands.registerTextEditorCommand(
    'translatr.reloadTranslations',
    function () {
      return provideLoadingCommand(translatr);
    }
  );

  const reactivateCommand = vscode.commands.registerCommand(
 'translatr.reloadTranslatrconfig',
    function () {
      translatr.updateTranslatrConfigFile();
      return provideLoadingCommand(translatr);
    }
  );

  const gotoCommand = vscode.commands.registerCommand(
    'translatr.goto',
    async function ({ locale, textKey }) {
      return await provideGoto(translatr, locale, textKey);
    }
  );

  context.subscriptions.push(loadingCommand, languageCommand, gotoCommand, reactivateCommand);
}



export function deactivate() {}
