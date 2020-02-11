const Koa = require('koa');
const config = require('config');
const _ = require('koa-route');
const helmet = require('koa-helmet');
const { logger } = require("./startup/logging");
const startupConfig = require("./startup/config");
const startupProd = require("./startup/prod");
const app = new Koa();
const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://elasticsearch:9200' })
const PORT = process.env.PORT || 3000;

startupConfig();
startupProd(app, helmet);

app.on('error', (err, ctx) => {
    console.log('server error', err, ctx);
});

app.use(_.get('/health', ctx => {
    ctx.body = "Hello world";
}));

app.use(_.get('/elasticTest', async ctx => {
    async function run() {
        // Let's start by indexing some data
        await client.index({
            index: 'game-of-thrones',
            // type: '_doc', // uncomment this line if you are using Elasticsearch ≤ 6
            body: {
                character: 'Ned Stark',
                quote: 'Winter is coming.'
            }
        })

        await client.index({
            index: 'game-of-thrones',
            // type: '_doc', // uncomment this line if you are using Elasticsearch ≤ 6
            body: {
                character: 'Daenerys Targaryen',
                quote: 'I am the blood of the dragon.'
            }
        })

        await client.index({
            index: 'game-of-thrones',
            // type: '_doc', // uncomment this line if you are using Elasticsearch ≤ 6
            body: {
                character: 'Tyrion Lannister',
                quote: 'A mind needs books like a sword needs a whetstone.'
            }
        })

        // here we are forcing an index refresh, otherwise we will not
        // get any result in the consequent search
        await client.indices.refresh({ index: 'game-of-thrones' })

        // Let's search!
        const { body } = await client.search({
            index: 'game-of-thrones',
            // type: '_doc', // uncomment this line if you are using Elasticsearch ≤ 6
            body: {
                query: {
                    match: { quote: 'winter' }
                }
            }
        })

        logger.info(body.hits.hits);
        return body.hits.hits;
    }
    try {
        ctx.body = await run();
    } catch (error) {
        logger.error(error)
    }
}));



app.use((ctx, next) => {
    const err = new Error('Not Found');
    ctx.status = 404;
    next(err);
});

app.listen(PORT, () => {
    logger.info(`listen to port: ${PORT} `);
});