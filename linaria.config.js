module.exports = {
    rules: [
        {
            action: require('@linaria/shaker').default,
        },
        {
            test: /\/node_modules\//,
            action: 'ignore',
        },
        {
            test: /\/node_modules\/@ui5\//,
            action: require('@linaria/shaker').default,
        },
    ]
};
