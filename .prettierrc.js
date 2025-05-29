module.exports = {
  // 기본 설정
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  
  // 들여쓰기
  tabWidth: 2,
  useTabs: false,
  
  // 줄 길이
  printWidth: 100,
  
  // 줄바꿈
  endOfLine: 'lf',
  
  // JSX 설정
  jsxSingleQuote: false,
  jsxBracketSameLine: false,
  
  // 파일별 설정
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      options: {
        parser: 'typescript',
      },
    },
  ],
}; 