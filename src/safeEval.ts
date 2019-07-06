interface WebWorkerMessage {
    i: number; // id
    r: any; // result
}

export function safeEval(code: string, fnOnStop: Function, timeout: number = 1000) {
    const id = Math.random() + 1;
    const blob = new Blob(
        ['onmessage=function(d){d=d.data;postMessage({i:d.i+1});postMessage({i:d.i,r:eval.call(this,d.c)})};'],
        { type:'text/javascript' }
    );
    const myWorkerUrl = URL.createObjectURL(blob);
    const myWorker = new Worker(myWorkerUrl);

    function onDone(done: boolean, result?: any) {
        URL.revokeObjectURL(myWorkerUrl);
        fnOnStop.apply(this, [done, result]);
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
                    myWorker.terminate();
                    onDone(false);
                }, timeout);
            }
        }
    };

    myWorker.postMessage({ c: code, i: id });
}
