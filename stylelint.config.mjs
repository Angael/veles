/** @type {import('stylelint').Config} */
export default {
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['custom-media'],
      },
    ],
    'block-no-empty': true,
    'color-no-invalid-hex': true,
    'custom-property-no-missing-var-function': true,
    'declaration-block-no-duplicate-properties': true,
    'declaration-block-no-shorthand-property-overrides': true,
    'function-calc-no-unspaced-operator': true,
    'media-query-no-invalid': true,
    'no-duplicate-selectors': true,
    'no-invalid-double-slash-comments': true,
    'property-no-unknown': true,
    'selector-pseudo-class-no-unknown': true,
    'selector-pseudo-element-no-unknown': true,
    'unit-no-unknown': true,
  },
};
