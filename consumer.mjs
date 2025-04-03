import { KyooConnection } from "@nhtio/kyoo";
import { abort, configuration, signal } from "./common.mjs";
import { inspect } from "node:util";

const consumerConnection = new KyooConnection(configuration);
signal.addEventListener("abort", () => {
    consumerConnection.disconnect(true).then(() => {
        console.log("Producer connection closed")
    })
})

const consumerQueue = consumerConnection.queues.get("example-queue");
const consumerWorker = consumerQueue.worker(async ({ job }, { ack }) => {
    console.log(`Processing job ${job.id} with payload:`, inspect(job.payload, { depth: 10, colors: true }));
    await ack();
}, {
    autoStart: false,
    blocking: true,
})

const showJobCountInterval = () => {
    consumerQueue.jobs.enqueued().then((total) => {
        console.log(`Total enqueued jobs: ${total}`);
    });
    if (signal.aborted) {
        return
    }
    const to = 1000
    setTimeout(showJobCountInterval, to)
}

console.log("Establishing consumer connection");
consumerConnection.connect().then((connected) => {
    if (connected) {
        console.log("Consumer connection established");
        showJobCountInterval();
        consumerWorker.resume();
        console.log(consumerWorker)
    } else {
        console.log("Consumer connection failed");
        consumerWorker.pause();
        abort();
        return;
    }
})