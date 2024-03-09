import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';
import { parse, TSESTree } from '@typescript-eslint/typescript-estree';
import { JsxAttribute, JsxAttributeValue } from 'typescript';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below




export function activate(context: vscode.ExtensionContext) {
	try {

		const filePath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.vscode', 'translatr.config.js');
		const fileContent = fs.readFileSync(filePath, 'utf8');
		require(filePath);
		const script = new vm.Script(fileContent);
		const sandbox = {};
		script.runInNewContext(sandbox);

		console.log(sandbox);
	} catch (error) {
		console.log('error', error);
	}
	let languageDisposable = vscode.languages.registerHoverProvider(
	{ scheme: 'file', language: '*' },
	{
		provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
			const range = document.getWordRangeAtPosition(position, /[a-zA-Z0-9_.]+/);
			let jsxIdentifier: string | null = null;
				let value: string | null = null;
			if (range) {
					const word = document.getText(range);
					const ast = parse(document.getText(), { sourceType: 'module', jsx: true });
					

					traverseAST(ast, (node: any) => {
						if (node.type === 'JSXAttribute' &&( node.name?.name as string)?.toUpperCase() === 'TEXTKEY' && node.value.value as string === word) {
							
									jsxIdentifier = node.name.name;
									value = node.value.value as string;
							} 
					});
			}
			if(jsxIdentifier && value) {
				return new vscode.Hover(`you hovering ${jsxIdentifier}: ${value}`);
			} else {
				return undefined;
			}
	}});
// 	let disposable3 = vscode.languages.registerHoverProvider({ scheme: 'file', language: '*' }, {
//     provideHover(document, position) {

//         let hoverRange;
//         const hoverLineText = document.lineAt(position.line).text;
//         const pattern = new RegExp("\\w+\\s*\\(.*\\s*\\)");
// 				console.log('ksdjfhskdjfhskdjfh', hoverLineText)
//         if (pattern.test(hoverLineText)){
//             hoverRange = document.getWordRangeAtPosition(position, pattern);
//             if (hoverRange) return new vscode.Hover(document.getText(hoverRange), new vscode.Range(position, position));
//             else return null;
//         }
//         else return null;
//     }
// });
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
