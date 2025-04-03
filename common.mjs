import 'dotenv/config'

const abortController = new AbortController();

const cleanup = async () => {
    abortController.abort();
};

process
    .on("unhandledRejection", (reason, p) => {
        console.error(reason, "Unhandled Rejection at Promise", p);
    })
    .on("uncaughtException", (err) => {
        console.error(err.stack);
        cleanup().finally(() => process.exit(1));
    })
    .on("SIGINT", () => {
        cleanup().finally(() => process.exit(255));
    })
    .on("SIGTERM", () => {
        cleanup().finally(() => process.exit(255));
    });

export const signal = abortController.signal;

const getConfiguration = () => {
    switch (process.env.KYOO_BROKER) {
        case 'bullmq':
            return {
                client: "bullmq",
                configuration: {
                    connection: {
                        host: process.env.REDIS_HOST,
                        port: process.env.REDIS_PORT,
                        password: process.env.REDIS_PASSWORD,
                        db: process.env.REDIS_DB,
                        tls: process.env.REDIS_TLS ? { rejectUnauthorized: false } : undefined,
                    }
                }
            }

        case 'amqp':
            return {
                client: "amqp",
                configuration: {
                    connection: {
                        host: {
                            protocol: process.env.AMQP_PROTOCOL,
                            hostname: process.env.AMQP_HOSTNAME,
                            port: process.env.AMQP_PORT,
                            username: process.env.AMQP_USERNAME,
                            password: process.env.AMQP_PASSWORD,
                            name: process.env.AMQP_NAME,
                            frameMax: process.env.AMQP_FRAMEMAX,
                            channelMax: process.env.AMQP_CHANNELMAX,
                            heartbeat: process.env.AMQP_HEARTBEAT,
                            vhost: process.env.AMQP_VHOST,
                        },
                        exchange: process.env.AMQP_EXCHANGE,
                    }
                }
            }

        case 'sqs':
            return {
                client: "sqs",
                configuration: {
                    region: "us-east-1",
                    endpoint: process.env.SQS_ENDPOINT,
                    credentials: {
                        accessKeyId: "fakeAccessKeyId",
                        secretAccessKey: "fakeSecretAccessKey",
                    },
                }
            }

        default:
            throw new Error(`Unsupported broker: ${process.env.KYOO_BROKER}`);
    }
}

export const configuration = getConfiguration();