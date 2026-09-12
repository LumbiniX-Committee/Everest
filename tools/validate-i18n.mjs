import { VISITOR_COPY } from '../i18n/visitor.ts';
import { NEPALI_UI_LITERALS, normalizeVisitorLiteral } from '../i18n/literals.ts';
import ts from 'typescript';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..');

const englishKeys = Object.keys(VISITOR_COPY.en).sort();
let failed = false;
for (const language of ['en', 'ne']) {
  const dictionary = VISITOR_COPY[language];
  const keys = Object.keys(dictionary).sort();
  const missing = englishKeys.filter((key) => !keys.includes(key) || !dictionary[key]?.trim());
  const extra = keys.filter((key) => !englishKeys.includes(key));
  if (missing.length || extra.length) {
    console.error(`${language}: missing [${missing.join(', ')}], extra [${extra.join(', ')}]`);
    failed = true;
  }
}

const placeholders = (value) => [...value.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]).sort();
for (const key of englishKeys) {
  const expected = placeholders(VISITOR_COPY.en[key]);
  for (const language of ['ne']) {
    const actual = placeholders(VISITOR_COPY[language][key]);
    if (expected.join('\0') !== actual.join('\0')) {
      console.error(`${language}: placeholder mismatch for ${key}; expected [${expected}], found [${actual}]`);
      failed = true;
    }
  }
}

const interfaceAttributes = new Set([
  'accessibilityHint',
  'accessibilityLabel',
  'actionLabel',
  'body',
  'emptyBody',
  'emptyTitle',
  'eyebrow',
  'footnote',
  'hint',
  'label',
  'legend',
  'placeholder',
  'sendLabel',
  'subtitle',
  'title',
]);
const copyDeclaration = /(COPY|DETAIL|LABEL|LABELS|OPTIONS|TEXT|TITLES)$/;
const nonCopyProperties = new Set(['id', 'key', 'kind', 'value']);

function filesUnder(directory) {
  const files = [];
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) files.push(...filesUnder(path));
    else if ((path.endsWith('.tsx') || path.endsWith('.ts')) && !path.includes('.test.')) files.push(path);
  }
  return files;
}

function literalValues(expression) {
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return [expression.text];
  }
  if (ts.isConditionalExpression(expression)) {
    return [...literalValues(expression.whenTrue), ...literalValues(expression.whenFalse)];
  }
  if (ts.isParenthesizedExpression(expression)) return literalValues(expression.expression);
  if (ts.isBinaryExpression(expression) && expression.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    return [...literalValues(expression.left), ...literalValues(expression.right)];
  }
  if (ts.isTemplateExpression(expression)) {
    return [expression.head.text, ...expression.templateSpans.map((span) => span.literal.text)];
  }
  return [];
}

const registeredLiterals = new Set(Object.keys(NEPALI_UI_LITERALS));
const literalFailures = [];
for (const base of ['app', 'features', 'components', 'types']) {
  for (const file of filesUnder(join(root, base))) {
    const source = ts.createSourceFile(
      file,
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const check = (raw, node) => {
      const value = normalizeVisitorLiteral(raw);
      if (!/[A-Za-z]/.test(value) || registeredLiterals.has(value)) return;
      const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
      literalFailures.push(`${relative(root, file)}:${line}: ${JSON.stringify(value)}`);
    };
    const visit = (node) => {
      if (ts.isJsxText(node)) check(node.text, node);
      if (ts.isJsxAttribute(node) && interfaceAttributes.has(node.name.text)) {
        if (node.initializer && ts.isStringLiteral(node.initializer)) check(node.initializer.text, node);
        if (node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression) {
          for (const value of literalValues(node.initializer.expression)) check(value, node);
        }
      }
      if (
        ts.isJsxExpression(node) &&
        node.expression &&
        (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))
      ) {
        for (const value of literalValues(node.expression)) check(value, node);
      }
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        copyDeclaration.test(node.name.text) &&
        node.initializer
      ) {
        const checkCopyValue = (candidate) => {
          if (
            (ts.isStringLiteral(candidate) || ts.isNoSubstitutionTemplateLiteral(candidate)) &&
            ts.isPropertyAssignment(candidate.parent) &&
            candidate.parent.initializer === candidate
          ) {
            const propertyName = candidate.parent.name.getText(source).replace(/^['"]|['"]$/g, '');
            if (!nonCopyProperties.has(propertyName)) check(candidate.text, candidate);
          }
          ts.forEachChild(candidate, checkCopyValue);
        };
        checkCopyValue(node.initializer);
      }
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const argumentIndex = node.expression.text === 'ui'
          ? 0
          : node.expression.text === 'visitorLiteralCopy'
            ? 1
            : -1;
        const argument = node.arguments[argumentIndex];
        if (argumentIndex >= 0 && argument) {
          for (const value of literalValues(argument)) check(value, argument);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
}

if (literalFailures.length) {
  console.error('Unregistered visitor-interface literals:');
  for (const issue of literalFailures) console.error(`  ${issue}`);
  failed = true;
}
if (failed) process.exit(1);
console.log(
  `visitor interface translations: ${englishKeys.length} semantic keys and ` +
    `${registeredLiterals.size} registered literals complete in English and Nepali`,
);
