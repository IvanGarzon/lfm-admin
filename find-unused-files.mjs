#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname, basename, extname } from 'path';

const SRC_DIR = './src';
const EXCLUDE_PATTERNS = [/\.test\./, /\.spec\./, /\.stories\./, /node_modules/];

const ENTRY_POINTS = [
  'src/app', // Next.js app directory
  'src/middleware.ts',
  'src/instrumentation.ts',
];

// Get all TypeScript/JavaScript files
function getAllFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach((file) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      if (!EXCLUDE_PATTERNS.some((pattern) => pattern.test(filePath))) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

// Extract all imports from a file
function extractImports(content, filePath) {
  const imports = new Set();

  // Match import statements
  const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];

    // Only track relative imports (starting with . or ..)
    if (importPath.startsWith('.')) {
      const dir = dirname(filePath);
      let resolvedPath = join(dir, importPath);

      // Try different extensions
      const extensions = [
        '',
        '.ts',
        '.tsx',
        '.js',
        '.jsx',
        '/index.ts',
        '/index.tsx',
        '/index.js',
        '/index.jsx',
      ];

      for (const ext of extensions) {
        const testPath = resolvedPath + ext;
        try {
          if (statSync(testPath).isFile()) {
            imports.add(testPath);
            break;
          }
        } catch {
          // File doesn't exist, continue
        }
      }
    }
  }

  // Match dynamic imports
  const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('.')) {
      const dir = dirname(filePath);
      const resolvedPath = join(dir, importPath);
      imports.add(resolvedPath);
    }
  }

  return imports;
}

// Check if file is a Next.js route or page
function isNextJsRoute(filePath) {
  const appRoutes =
    /src\/app\/.*\/(page|layout|loading|error|not-found|route|template|default)\.(ts|tsx|js|jsx)$/;
  return appRoutes.test(filePath);
}

// Find files that are never imported
async function findUnusedFiles() {
  console.log('🔍 Searching for unused files...\n');

  const allFiles = getAllFiles(SRC_DIR);
  const importedFiles = new Set();
  const importGraph = new Map();

  // Build import graph
  for (const file of allFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const imports = extractImports(content, file);

      importGraph.set(file, imports);

      imports.forEach((importedFile) => {
        importedFiles.add(importedFile);
      });
    } catch (err) {
      // Skip files that can't be read
    }
  }

  // Find unused files (not imported and not entry points)
  const unusedFiles = [];

  for (const file of allFiles) {
    const isImported = importedFiles.has(file);
    const isRoute = isNextJsRoute(file);
    const isEntryPoint = ENTRY_POINTS.some((entry) => file.startsWith(entry));

    if (!isImported && !isRoute && !isEntryPoint) {
      unusedFiles.push(file);
    }
  }

  // Group by directory
  const groupedByDir = {};
  unusedFiles.forEach((file) => {
    const dir = dirname(file);
    if (!groupedByDir[dir]) {
      groupedByDir[dir] = [];
    }
    groupedByDir[dir].push(basename(file));
  });

  console.log('═'.repeat(80));
  console.log('📋 UNUSED FILES REPORT');
  console.log('═'.repeat(80));
  console.log();

  if (unusedFiles.length > 0) {
    console.log(`⚠️  Found ${unusedFiles.length} potentially unused files:\n`);
    console.log('Note: These files are not imported anywhere and are not Next.js routes.\n');
    console.log('─'.repeat(80));

    Object.entries(groupedByDir)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([dir, files]) => {
        const relDir = relative(process.cwd(), dir);
        console.log(`\n📁 ${relDir}/`);
        files.forEach((file) => console.log(`   • ${file}`));
      });
  } else {
    console.log('✅ No unused files found!');
  }

  console.log('\n' + '═'.repeat(80));
  console.log(`\n✨ Analyzed ${allFiles.length} files\n`);
}

findUnusedFiles().catch(console.error);
