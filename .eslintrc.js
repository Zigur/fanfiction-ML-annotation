module.exports = {
    root: true,

    parserOptions: {
        sourceType: 'module'
    },
    env: {
        node: true,
    },    

    extends: 'standard',

    rules: {
        'indent': [
            'error',
            4,
            {
                'SwitchCase': 1
            }
        ],
        'quotes': [
            'warn',
            'single'
        ],
        'semi': [
            'warn',
            'always'
        ],
        'no-unused-vars': 'warn',
        // allow paren-less arrow functions
        'arrow-parens': 0,
        // allow async-await
        'generator-star-spacing': 0,
        // do not allow the space after the function name
        'space-before-function-paren': ['warn', 'never'],
        // allow debugger during development
        'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
        'no-trailing-spaces': 0,
        'padded-blocks': 0
    }
    
};