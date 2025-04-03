import { KyooConnection } from "@nhtio/kyoo";
import { abort, configuration, signal } from "./common.mjs";
import { randomInt } from "node:crypto";

const producerConnection = new KyooConnection(configuration);
signal.addEventListener("abort", () => {
    producerConnection.disconnect(true).then(() => {
        console.log("Producer connection closed")
    });
})

const producerQueue = producerConnection.queues.get("example-queue");

const doEnqueue = async () => {
    if (signal.aborted) {
        return
    }
    const jobs = Array(randomInt(1, 100)).fill(0).map((_, i) => ({
        payload: {
            now: new Date(),
            index: i,
        }
    }))
    await producerQueue.jobs.enqueue(...jobs)
    const total = await producerQueue.jobs.enqueued()
    console.log(`Enqueued ${jobs.length} jobs, total enqueued: ${total}`);
    if (signal.aborted) {
        return
    }
    const to = randomInt(500, 5000)
    console.log(`Enqueued ${jobs.length} jobs, waiting ${to}ms to enqueue again`);
    setTimeout(doEnqueue, to)
}

console.log("Establishing producer connection");
producerConnection.connect().then((connected) => {
    if (connected) {
        console.log("Producer connection established");
        doEnqueue();
    } else {
        console.log("Producer connection failed");
        abort();
        return;
    }
})