/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
    app(input) {
        return {
            name: 'moai',
            removal: input?.stage === 'production' ? 'retain' : 'remove',
            home: 'aws'
        }
    },
    async run() {
        const domain =
            $app.stage === 'production'
                ? process.env.DOMAIN
                : `${$app.stage}-${process.env.DOMAIN}`
        new sst.aws.Remix('moai', {
            domain: domain
        })
    }
})
