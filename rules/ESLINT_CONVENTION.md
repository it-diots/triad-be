# ESLint 설정 가이드

## 개요
TypeScript 기반 NestJS 프로젝트의 코드 품질과 일관성을 유지하기 위한 ESLint 설정 가이드입니다.

## 원칙
- **타입 안정성**: TypeScript의 타입 시스템을 최대한 활용
- **일관성**: 팀 전체가 동일한 코드 스타일 유지
- **가독성**: 명확하고 이해하기 쉬운 코드 작성
- **유지보수성**: 장기적 관점에서의 코드 품질 보장

## 필수 패키지 설치

```bash
npm install -D \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  eslint \
  eslint-config-prettier \
  eslint-plugin-prettier \
  eslint-plugin-import \
  eslint-plugin-jest \
  prettier
```

## .eslintrc.js 설정

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
    ecmaVersion: 2022,
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'jest',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:prettier/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
    es2022: true,
  },
  ignorePatterns: [
    '.eslintrc.js',
    'dist',
    'node_modules',
    '**/*.spec.ts',
    '**/*.e2e-spec.ts',
  ],
  rules: {
    // TypeScript 엄격한 타입 규칙
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/strict-boolean-expressions': ['error', {
      allowString: false,
      allowNumber: false,
      allowNullableObject: false,
    }],
    
    // 네이밍 컨벤션
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: {
          regex: '^I[A-Z]',
          match: false,
        },
      },
      {
        selector: 'typeAlias',
        format: ['PascalCase'],
      },
      {
        selector: 'enum',
        format: ['PascalCase'],
      },
      {
        selector: 'enumMember',
        format: ['UPPER_CASE'],
      },
      {
        selector: 'class',
        format: ['PascalCase'],
      },
      {
        selector: 'method',
        format: ['camelCase'],
      },
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE'],
        leadingUnderscore: 'allow',
      },
      {
        selector: 'parameter',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
      },
    ],
    
    // Import 관련 규칙
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling'],
          'index',
          'object',
          'type',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-unresolved': 'error',
    'import/no-cycle': 'error',
    'import/no-duplicates': 'error',
    
    // 일반 JavaScript/TypeScript 규칙
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'brace-style': ['error', '1tbs'],
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
    'no-return-await': 'error',
    'require-await': 'error',
    'no-async-promise-executor': 'error',
    
    // NestJS 특화 규칙
    '@typescript-eslint/member-ordering': [
      'error',
      {
        default: [
          // Index signature
          'signature',
          
          // Fields
          'public-static-field',
          'protected-static-field',
          'private-static-field',
          
          'public-decorated-field',
          'protected-decorated-field',
          'private-decorated-field',
          
          'public-instance-field',
          'protected-instance-field',
          'private-instance-field',
          
          // Constructors
          'constructor',
          
          // Methods
          'public-static-method',
          'protected-static-method',
          'private-static-method',
          
          'public-decorated-method',
          'protected-decorated-method',
          'private-decorated-method',
          
          'public-instance-method',
          'protected-instance-method',
          'private-instance-method',
        ],
      },
    ],
    
    // 복잡도 관련 규칙
    'complexity': ['error', 10],
    'max-depth': ['error', 4],
    'max-lines': ['error', 400],
    'max-lines-per-function': ['error', 50],
    'max-params': ['error', 4],
  },
  overrides: [
    {
      // DTO 파일에 대한 예외 규칙
      files: ['**/*.dto.ts'],
      rules: {
        '@typescript-eslint/member-ordering': 'off',
      },
    },
    {
      // 테스트 파일에 대한 예외 규칙
      files: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'max-lines-per-function': 'off',
        'max-lines': 'off',
      },
    },
    {
      // 설정 파일에 대한 예외 규칙
      files: ['*.config.ts', '*.config.js'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
      },
    },
  ],
};
```

## .prettierrc 설정

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "useTabs": false
}
```

## .prettierignore 설정

```
# Dependencies
node_modules

# Production
dist
build

# IDE
.idea
.vscode

# Logs
*.log

# Testing
coverage
.nyc_output

# Cache
.eslintcache
.cache

# Generated files
*.generated.ts
*.generated.js
```

## package.json 스크립트

```json
{
  "scripts": {
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "lint:fix": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\" \"test/**/*.ts\"",
    "pre-commit": "npm run lint && npm run format:check"
  }
}
```

## VS Code 설정

`.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.updateImportsOnFileMove.enabled": "always",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## 주요 규칙 설명

### 타입 관련
- **no-explicit-any**: `any` 타입 사용 금지
- **explicit-function-return-type**: 모든 함수에 반환 타입 명시
- **strict-boolean-expressions**: boolean 검사 시 명시적 비교 요구

### 네이밍 컨벤션
- **인터페이스**: PascalCase (I 접두사 금지)
- **클래스**: PascalCase
- **메서드/변수**: camelCase
- **상수**: UPPER_CASE
- **Enum 멤버**: UPPER_CASE

### 코드 품질
- **복잡도**: 순환 복잡도 10 이하
- **함수 길이**: 50줄 이하
- **파일 길이**: 400줄 이하
- **매개변수 개수**: 4개 이하

## 실행 방법

```bash
# 린트 검사
npm run lint

# 자동 수정
npm run lint:fix

# 포맷팅 적용
npm run format

# 포맷팅 검사
npm run format:check
```

## Git Hooks 설정 (Husky)

```bash
npm install -D husky lint-staged
npx husky-init
```

`.husky/pre-commit`:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

`package.json`:
```json
{
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

## 예외 처리

특정 라인에서 ESLint 규칙을 무시해야 하는 경우:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = fetchData();

/* eslint-disable @typescript-eslint/no-unused-vars */
const unusedVar = 'temporary';
/* eslint-enable @typescript-eslint/no-unused-vars */
```

## 점진적 적용 전략

1. **Phase 1**: 기본 규칙 적용 (에러만)
2. **Phase 2**: 타입 엄격성 강화
3. **Phase 3**: 코드 복잡도 규칙 추가
4. **Phase 4**: 팀 피드백 반영 및 커스터마이징