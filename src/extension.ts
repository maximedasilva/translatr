import * as vscode from 'vscode';
import loader from './loader';
import Translations from './translations';
import { hoverProvider, provideLoadingCommand } from './providers';
import path from 'path';
export function activate(context: vscode.ExtensionContext) {
	const translatr = new Translations(loader);
	setImmediate(() => {
		vscode.commands.executeCommand('translatr.reloadTranslations');
	});

	const languageDisposable = vscode.languages.registerHoverProvider(
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

	const disposable = vscode.commands.registerCommand(
		'translatr.goto',
		async({locale, textKey}) => {
			const document = await vscode.workspace.openTextDocument(
				path.join(translatr.getLangPath(locale),
				textKey.split('.')[0]+'.js')
			);
			vscode.window.showTextDocument(document);

			vscode.window.showInformationMessage(`Locale: ${locale}, Value: ${textKey}`);
		}
	);
	context.subscriptions.push(loadingCommand, languageDisposable, disposable);
}



export function deactivate() {}
