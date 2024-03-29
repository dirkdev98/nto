import { join } from "path";

// Returns all project files that are in the test directory or
// end with _test.ts / _test.js
export function filterTestFiles(rootDir: string, files: string[]): string[] {
  const result: string[] = [];
  const testDir = join(rootDir, "test");

  for (const file of files) {
    if (file.startsWith(testDir) || file.endsWith("_test.js") || file.endsWith("_test.ts")) {
      result.push(file);
    }
  }

  return result;
}

export function generateFile(imports: string[], isBenchmark: boolean): string {
  let source = `import { BenchmarkHelper, TestHelper } from "nto/out/lib/pkg/testing/helper";
  `;

  for (let i = 0; i < imports.length; ++i) {
    source += `import * as test${i} from "${imports[i].substr(0, imports[i].length - 3)}";\n`;
  }

  source += `\nconst sources = [\n`;
  for (let i = 0; i < imports.length; ++i) {
    source += `test${i},\n`;
  }
  source += "];\n";

  source += `
  async function main() {
    for (const src of sources) {
      for (const funcName in src) {
        if (!funcName.startsWith("test") && !${isBenchmark}) {
          continue;
        }
        if (!funcName.startsWith("benchmark") && ${isBenchmark}) {
          continue;
        }
      
        // @ts-ignore
        const fn = src[funcName];
        if (fn.length !== 1) {
          throw new Error("Exported test function with name '" + funcName + "' is not valid. Should expect a single argument"); 
        }
        const helper = ${isBenchmark} ? new BenchmarkHelper(funcName, fn) : new TestHelper(funcName, fn);
        await helper.exec();
      }
    }  
  }
  
  main().catch(console.error.bind(console));
  `;

  return source;
}
