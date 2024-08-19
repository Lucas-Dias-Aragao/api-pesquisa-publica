import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettier, // Configuração do Prettier incluída diretamente
  {
    languageOptions: {
      globals: {  process: 'readonly', // Indica que `process` é uma variável global de somente leitura
        console: 'readonly', // Indica que `console` é uma variável global de somente leitura
      }
      ,
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'none' }],
      'no-undef': 'warn',
      semi: ['error', 'always'],
      indent: ['error', 2],
      quotes: ['error', 'single'],
      'comma-spacing': ['error', { before: false, after: true }],
      'space-before-function-paren': ['error', 'never'], // Comum no Node.js não exigir espaço antes dos parênteses
      eqeqeq: ['error', 'always'],
      'no-console': 'off', // Permite o uso de console
    },
    // Adicione outras configurações aqui se necessário
  },
];