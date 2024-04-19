import * as vscode from 'vscode';
import loader from './loader';
import Translations from './translations';
import {
	hoverProvider,
	provideGoto,
	provideLoadingCommand,
	providenewTranslation
} from './providers';

export function activate(context: vscode.ExtensionContext) {
	let translatr: Translations;
	setImmediate(async() => {
		translatr = new Translations(loader);
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

	const gotoCommand = vscode.commands.registerCommand(
		'translatr.goto',
		async function ({ locale, textKey }) {
			return await provideGoto(translatr, locale, textKey);
		}
	);

	const newTranslationCommand = vscode.commands.registerCommand(
		'translatr.newTranslation',
		async function () {
			return await providenewTranslation(translatr);
		}
	);

	context.subscriptions.push(loadingCommand, languageCommand, gotoCommand, newTranslationCommand);
}



export function deactivate() {}
