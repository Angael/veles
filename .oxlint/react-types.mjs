const bannedTypes = new Set(['ComponentPropsWithRef', 'ComponentPropsWithoutRef']);
const message = 'Use ComponentProps; in React 19 ref is a regular prop.';

/** Flags the ref-specific ComponentProps variants, imported from react or used as `React.X`. */
const noComponentPropsRefVariantsRule = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Prefer ComponentProps over its ref-specific variants.' },
  },
  create(context) {
    return {
      ImportSpecifier(node) {
        if (node.parent.source.value !== 'react') return;
        if (bannedTypes.has(node.imported.name)) context.report({ node, message });
      },
      TSQualifiedName(node) {
        if (bannedTypes.has(node.right.name)) context.report({ node, message });
      },
    };
  },
};

export default {
  meta: { name: 'veles-react', version: '1.0.0' },
  rules: { 'no-component-props-ref-variants': noComponentPropsRefVariantsRule },
};
