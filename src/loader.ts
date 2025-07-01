import * as fs from 'fs';
import * as parser from '@babel/plugin-transform-modules-commonjs';
import * as vm from 'vm';
import { TransformOptions, transformSync } from '@babel/core';

const options: TransformOptions = {
  babelrc: true,
  compact: false,
  sourceType: 'module',
  plugins: [parser],
};
const loader = {
  load: (filePath: string, config?: Array<{ importName: string, importInfos: Object }>) => {
  
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const transpiledCode = transformSync(fileContent, options);
      const script = new vm.Script(transpiledCode.code, {
        filename: filePath,
      });

      // Custom require to mock @neoframe/models/constants
      function fakeRequire(moduleName: string) {
        if (config) {
          const found = config.find((item) => item.importName === moduleName);
          if (found) {
            return found.importInfos;
          } else {
            return require(moduleName);
          }
        }
        return require(moduleName);
      }
      const sandbox: vm.Context = {
        module: {},
        exports: exports,
        console: console,
        require: fakeRequire,
        __filename: filePath,
        __dirname: filePath,
      };

      script.runInNewContext(sandbox);

      return sandbox?.exports?.default;
    } catch (error) {
      console.log('error', error);
    }
  }
}

export default loader;