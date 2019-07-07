interface WebWorkerMessage {
    i: number; // id
    r: any; // result
}

const blob = new Blob(
    ['onmessage=function(d){d=d.data;postMessage({i:d.i+1});postMessage({i:d.i,r:eval.call(this,d.c)})}'],
    { type:'text/javascript' }
);
const myWorkerUrl = URL.createObjectURL(blob);


export function safeEval<T>(code: string, timeout: number = 1000): Promise<T> {
    return new Promise(((resolve, reject) => {
        const id = Math.random() + 1;
        const myWorker = new Worker(myWorkerUrl, {
            name: "ExecuteUnsafeCode",
        });

        function onDone(done: boolean, result?: any) {
            myWorker.terminate();
            if (done) {
                resolve(result);
            } else {
                reject();
            }
        }

        let timerId;
        myWorker.onmessage = (data) => {
            const message: WebWorkerMessage = data.data;
            if (message) {
                if (message.i === id) {
                    if (timerId) {
                        clearTimeout(timerId);
                    }
                    onDone(true, message.r);
                }
                else if (message.i === id + 1) {
                    timerId = setTimeout(() => {
                        onDone(false);
                    }, timeout);
                }
            }
        };

        myWorker.postMessage({ c: code, i: id });
    }));
}
