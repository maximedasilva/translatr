import * as vscode from 'vscode';
import loader from './loader';
import Translations from './translations';
import { hoverProvider, provideGoto, provideLoadingCommand } from './providers';

export function activate(context: vscode.ExtensionContext) {
	const translatr = new Translations(loader);
	setImmediate(() => {
		vscode.commands.executeCommand('translatr.reloadTranslations');
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

	const gotoCommand = vscode.commands.registerCommand(
		'translatr.goto',
		async function ({ locale, textKey }) {
			return await provideGoto(translatr, locale, textKey);
		}
	);

	context.subscriptions.push(loadingCommand, languageCommand, gotoCommand);
}



export function deactivate() {}
