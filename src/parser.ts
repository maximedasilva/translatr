import * as vscode from 'vscode';
import { parse, TSESTree } from '@typescript-eslint/typescript-estree';

const parseFile = (document: vscode.TextDocument, position: vscode.Position) => {
  const range = document.getWordRangeAtPosition(position, /[a-zA-Z0-9_.]+/);
  let textKey: string = null;
  
  if (range) {
    const word = document.getText(range);
    const ast = parse(document.getText(), { sourceType: 'module', jsx: true });
    traverseAST(ast, (node: any) => {
      if (node.value?.value as string === word || node.value === word) {
        textKey = node.value?.value || node.value as string;
        } 
    });
  }
  return textKey;
};

const traverseAST = (node: TSESTree.Node, callback: (node: TSESTree.Node) => void) => {
	callback(node);
	for (const key in node) {
			if (node[key] && typeof node[key] === 'object' && node[key].type) {
					traverseAST(node[key] as TSESTree.Node, callback);
			} else if (Array.isArray(node[key])) {
				(node[key] as TSESTree.Node[]).forEach((child) => {
					traverseAST(child, callback);
				});
			}
	}
};

export default parseFile;