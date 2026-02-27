#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const SRC_DIR = './src';
const EXCLUDE_PATTERNS = [
  /\.test\./,
  /\.spec\./,
  /\.stories\./,
  /node_modules/,
];

// Get all TypeScript/JavaScript files
function getAllFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      if (!EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath))) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

// Extract exports from a file
function extractExports(content, filePath) {
  const exports = [];

  // Named exports: export const/function/class/interface/type
  const namedExportRegex = /export\s+(?:const|let|var|function|class|interface|type|enum)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  let match;
  while ((match = namedExportRegex.exec(content)) !== null) {
    exports.push({ name: match[1], type: 'named', filePath });
  }

  // Export { x, y }
  const exportListRegex = /export\s+\{([^}]+)\}/g;
  while ((match = exportListRegex.exec(content)) !== null) {
    const names = match[1].split(',').map(n => {
      const parts = n.trim().split(/\s+as\s+/);
      return parts[parts.length - 1].trim();
    });
    names.forEach(name => {
      if (name && name !== 'default') {
        exports.push({ name, type: 'named', filePath });
      }
    });
  }

  // Default export
  if (/export\s+default/.test(content)) {
    exports.push({ name: 'default', type: 'default', filePath });
  }

  return exports;
}

// Check if an export is used in any file
function isExportUsed(exportName, filePath, allFiles) {
  if (exportName === 'default') return true; // Skip default exports for now

  const relativePath = relative(SRC_DIR, filePath);

  for (const file of allFiles) {
    if (file === filePath) continue;

    try {
      const content = readFileSync(file, 'utf-8');

      // Check for named imports
      const importRegex = new RegExp(`import\\s+.*\\{[^}]*\\b${exportName}\\b[^}]*\\}`, 'g');
      if (importRegex.test(content)) {
        return true;
      }

      // Check for usage in the file
      const usageRegex = new RegExp(`\\b${exportName}\\b`, 'g');
      const matches = content.match(usageRegex);
      if (matches && matches.length > 0) {
        return true;
      }
    } catch (err) {
      // Skip files that can't be read
    }
  }

  return false;
}

// Find unused imports in a file
function findUnusedImports(content, filePath) {
  const unusedImports = [];

  // Extract all imports
  const importRegex = /import\s+(?:(?:{([^}]+)})|([a-zA-Z_$][a-zA-Z0-9_$]*))\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const namedImports = match[1];
    const defaultImport = match[2];
    const source = match[3];

    if (namedImports) {
      const imports = namedImports.split(',').map(i => i.trim().split(/\s+as\s+/).pop().trim());

      imports.forEach(importName => {
        // Check if this import is used in the file
        const usageRegex = new RegExp(`\\b${importName}\\b`, 'g');
        const matches = content.match(usageRegex);

        // If only found once (the import itself), it's unused
        if (!matches || matches.length <= 1) {
          unusedImports.push({ name: importName, source, filePath });
        }
      });
    }

    if (defaultImport) {
      const usageRegex = new RegExp(`\\b${defaultImport}\\b`, 'g');
      const matches = content.match(usageRegex);

      if (!matches || matches.length <= 1) {
        unusedImports.push({ name: defaultImport, source, filePath });
      }
    }
  }

  return unusedImports;
}

// Find unreachable code patterns
function findUnreachableCode(content, filePath) {
  const issues = [];

  // Code after return
  const lines = content.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (/^return\s/.test(line) && !line.endsWith('{')) {
      const nextLine = lines[i + 1].trim();
      if (nextLine && !nextLine.startsWith('}') && !nextLine.startsWith('//')) {
        issues.push({
          type: 'unreachable',
          line: i + 2,
          filePath,
          message: 'Code after return statement'
        });
      }
    }
  }

  return issues;
}

// Main analysis
async function analyzeDeadCode() {
  console.log('🔍 Analyzing codebase for dead code...\n');

  const allFiles = getAllFiles(SRC_DIR);
  console.log(`📁 Found ${allFiles.length} files to analyze\n`);

  const allExports = [];
  const allUnusedImports = [];
  const allUnreachableCode = [];

  // Extract all exports and find unused imports
  for (const file of allFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const exports = extractExports(content, file);
      allExports.push(...exports);

      const unusedImports = findUnusedImports(content, file);
      allUnusedImports.push(...unusedImports);

      const unreachable = findUnreachableCode(content, file);
      allUnreachableCode.push(...unreachable);
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
    }
  }

  console.log(`📊 Found ${allExports.length} exports\n`);

  // Find unused exports
  console.log('🔎 Checking for unused exports...\n');
  const unusedExports = [];

  for (const exp of allExports) {
    if (exp.name === 'default') continue; // Skip default exports

    if (!isExportUsed(exp.name, exp.filePath, allFiles)) {
      unusedExports.push(exp);
    }
  }

  // Print results
  console.log('═'.repeat(80));
  console.log('📋 DEAD CODE ANALYSIS REPORT');
  console.log('═'.repeat(80));
  console.log();

  if (unusedExports.length > 0) {
    console.log(`\n⚠️  UNUSED EXPORTS (${unusedExports.length}):`);
    console.log('─'.repeat(80));

    const groupedByFile = {};
    unusedExports.forEach(exp => {
      const relPath = relative(process.cwd(), exp.filePath);
      if (!groupedByFile[relPath]) {
        groupedByFile[relPath] = [];
      }
      groupedByFile[relPath].push(exp.name);
    });

    Object.entries(groupedByFile).forEach(([file, names]) => {
      console.log(`\n📄 ${file}`);
      names.forEach(name => console.log(`   • ${name}`));
    });
  } else {
    console.log('\n✅ No unused exports found!');
  }

  if (allUnusedImports.length > 0) {
    console.log(`\n\n⚠️  UNUSED IMPORTS (${allUnusedImports.length}):`);
    console.log('─'.repeat(80));

    const groupedByFile = {};
    allUnusedImports.forEach(imp => {
      const relPath = relative(process.cwd(), imp.filePath);
      if (!groupedByFile[relPath]) {
        groupedByFile[relPath] = [];
      }
      groupedByFile[relPath].push(`${imp.name} from '${imp.source}'`);
    });

    Object.entries(groupedByFile).slice(0, 20).forEach(([file, imports]) => {
      console.log(`\n📄 ${file}`);
      imports.forEach(imp => console.log(`   • ${imp}`));
    });

    if (Object.keys(groupedByFile).length > 20) {
      console.log(`\n   ... and ${Object.keys(groupedByFile).length - 20} more files`);
    }
  } else {
    console.log('\n✅ No unused imports found!');
  }

  if (allUnreachableCode.length > 0) {
    console.log(`\n\n⚠️  UNREACHABLE CODE (${allUnreachableCode.length}):`);
    console.log('─'.repeat(80));

    allUnreachableCode.slice(0, 10).forEach(issue => {
      const relPath = relative(process.cwd(), issue.filePath);
      console.log(`\n📄 ${relPath}:${issue.line}`);
      console.log(`   ${issue.message}`);
    });

    if (allUnreachableCode.length > 10) {
      console.log(`\n   ... and ${allUnreachableCode.length - 10} more issues`);
    }
  } else {
    console.log('\n✅ No unreachable code found!');
  }

  console.log('\n' + '═'.repeat(80));
  console.log('\n✨ Analysis complete!\n');
}

analyzeDeadCode().catch(console.error);
