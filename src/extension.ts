import * as vscode from 'vscode';
import loader from './loader';
import Translations from './translations';
import { MyCompletionItemProvider, hoverProvider, provideGoto, provideLoadingCommand, provideTextKey } from './providers';

export function activate(context: vscode.ExtensionContext) {
	const translatr: Translations = new Translations(loader);
	setImmediate(async() => {
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

	const generateCommand = vscode.commands.registerCommand(
		'translatr.generate',
		async function ({ locale = 'fr' } = {}) {
			console.log(locale);
			console.log(await provideTextKey(translatr, locale));
		}
	);

	vscode.languages.registerCompletionItemProvider(
		{ pattern: '**/*.tsx' }, // Provide completion items for .js files
	new MyCompletionItemProvider(translatr),
		'.'
	);
	context.subscriptions.push(loadingCommand, languageCommand, gotoCommand, generateCommand);
}



export function deactivate() {} 
