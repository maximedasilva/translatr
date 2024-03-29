import * as vscode from 'vscode';
import { parse, TSESTree } from '@typescript-eslint/typescript-estree';
import { Node } from '@babel/traverse';
import { File } from '@babel/types';

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

const generateFullPath = (path: Node, textKey: string) => {
  const keys = textKey.split('.');
  keys.shift();
  let objectPath: any = path;
  ((path as File).program.body[0] as any).declaration.properties.map(node => {
    if (node.key.name === keys[0]) {
      objectPath = node;
    }
  });
  for (let i = 0; i < keys.length; i++) {
    if (objectPath && (objectPath.key as any)?.name === keys[i]) {
      if (i === keys.length - 1) {
        return { start: objectPath.value.start, end: objectPath.value.end };
      } else {
        objectPath = (objectPath.value as any).properties.find(
          property => property.key?.name === keys[i + 1]
        );
      }
    } else {
      return null;
    }
  }
};

export  {parseFile, generateFullPath};