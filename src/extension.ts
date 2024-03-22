import * as vscode from 'vscode';
import loader from './loader';
import Translations from './translations';
import { hoverProvider, provideHelloCommand } from './providers';
import path from 'path';
export function activate(context: vscode.ExtensionContext) {
	const translatr = new Translations(loader);
	translatr.loadLanguages();
	translatr.getTranslations();

	const languageDisposable = vscode.languages.registerHoverProvider(
		{ scheme: 'file', language: '*' },
		{
			provideHover(document: vscode.TextDocument, position: vscode.Position) {
				return hoverProvider(translatr, document, position);
			}
		}
	);

	const helloCommand = vscode.commands.registerTextEditorCommand(
		'translatr.reloadTranslations',
		function () {
			return provideHelloCommand(translatr);
		}
	);

	let disposable = vscode.commands.registerCommand('translatr.goto', async({locale, textKey}) => {
    // Your custom function here

		const document = await vscode.workspace.openTextDocument(path.join(translatr.getLangPath(), textKey.split('.')[0]+'.js'));
    vscode.window.showTextDocument(document);

    vscode.window.showInformationMessage(`Locale: ${locale}, Value: ${textKey}`);
});
	context.subscriptions.push(helloCommand, languageDisposable, disposable);
}



export function deactivate() {}
