import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { parse, TSESTree } from '@typescript-eslint/typescript-estree';
import loader from './loader';
import Translations, { TranslationObject } from './translations';

export function activate(context: vscode.ExtensionContext) {
	let formsFR = {};
		// const formsPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'src', 'languages', 'fr', 'forms.js');
		// formsFR = loader(formsPath);
		const translatr = new Translations(loader);
		const a = translatr.getTranslations();
		console.log(a);
	let languageDisposable = vscode.languages.registerHoverProvider(
	{ scheme: 'file', language: '*' },
	{
		provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
			const range = document.getWordRangeAtPosition(position, /[a-zA-Z0-9_.]+/);
			let textKey: string = null;
			
			if (range) {
					const word = document.getText(range);
					console.log(word);
					const ast = parse(document.getText(), { sourceType: 'module', jsx: true });
					traverseAST(ast, (node: any) => {
						if (node.value?.value as string === word || node.value === word) {
							textKey = node.value?.value || node.value as string;
							} 
					});
			}
			if(textKey) {
				const value: Array<{ locale: string, value: string | TranslationObject}> = translatr.getTranslation(textKey);
					if(value.length > 0) {
						const translations = value.map(translation =>
							`Locale: ${translation.locale}, Value: ${translation.value}`)
							.join('\n');
						const md = new vscode.MarkdownString();
						md.appendCodeblock(`📁 Translatr\n\n${translations}`, 'markdown');
						return new vscode.Hover(md);
				}
			} else {
				return undefined;
			}
	}});

let helloCommand = vscode.commands.registerTextEditorCommand('translatr.helloWorld', function (document: vscode.TextEditor, range: vscode.TextEditorEdit, ...rest: any[]) {
	const ast = parse(document.document.getText(), { sourceType: 'module', jsx: true });

	fs.writeFileSync(path.join(__dirname, 'log.txt'), JSON.stringify(ast, null, 2));
	vscode.window.showInformationMessage('Heldddlo!');
});

	context.subscriptions.push(helloCommand, languageDisposable);
}

function traverseAST(node: TSESTree.Node, callback: (node: TSESTree.Node) => void) {
	callback(node);
	for (let key in node) {
			if (node[key] && typeof node[key] === 'object' && node[key].type) {
					traverseAST(node[key] as TSESTree.Node, callback);
			} else if (Array.isArray(node[key])) {
				(node[key] as TSESTree.Node[]).forEach((child) => {
					traverseAST(child, callback);
				});
			}
	} 
}

export function deactivate() {}
