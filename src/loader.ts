import * as fs from 'fs';
import * as parser from '@babel/plugin-transform-modules-commonjs'
import * as vm from 'vm';
import { TransformOptions, transformSync } from '@babel/core';

const options: TransformOptions = {
	babelrc: true,
	compact: false,
	sourceType: 'module',
	plugins: [parser],
};
const loader = (filePath: string) => {
  try {
		const fileContent = fs.readFileSync(filePath, 'utf8');
		const transpiledCode = transformSync(fileContent, options);
		// Create a new script using the file content
		const script = new vm.Script(transpiledCode.code, {
				filename: filePath,
		});

		// Define the sandbox/context
		const sandbox: vm.Context = {
				module: {},
				exports: exports,
				console: console,
				require: require,
				__filename: filePath,
				__dirname: filePath,
		};

		// Run the script in the new context
		script.runInNewContext(sandbox);

		// Now you can access the exported values
    return sandbox?.exports?.default;
	} catch (error) {
		console.log('error', error);
	}
};

export default loader;