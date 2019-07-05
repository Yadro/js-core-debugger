import { CoreDebugger } from '../src';

const code = `function search(key, array) {
    var low = 0;
    var high = array.length - 1;
    while (low <= high) {
        var mid = Math.floor((low + high) / 2);
        var value = array[mid];
        if (value < key) {
            low = mid = 1;
        } else if (value > key) {
            high = mid - 1;
        } else {
            return mid;
        }
    }
    return 1;
}`;

const resultCode = `function search(key, array) {__$YD$__ident(1,'key',key);__$YD$__ident(1,'array',array);
    var low = 0;__$YD$__varDecl(2,'low',low);
    var high = array.length - 1;__$YD$__varDecl(3,'high',high);
    while (low <= high) {
        var mid = Math.floor((low + high) / 2);__$YD$__varDecl(5,'mid',mid);
        var value = array[mid];__$YD$__varDecl(6,'value',value);
        if (value < key) {
            low = mid = 1;__$YD$__ident(8,'low',low);
        } else if (value > key) {
            high = mid - 1;__$YD$__ident(10,'high',high);
        } else {
            return mid;__$YD$__ident(12,'mid',mid);
        }
    }
    return 1;__$YD$__ident(15,'return',1);
}`;

test('Parse code', () => {
    const coreDebugger = new CoreDebugger();
    coreDebugger.codeGenerate(code);
    const expected = resultCode.concat(';search();');
    expect(coreDebugger._input.join('\n')).toBe(expected);
});

test('Parse and Execute', () => {
    const coreDebugger = new CoreDebugger();
    coreDebugger.codeGenerate(code, {
        "1:key": 'd',
        "1:array": ['a', 'b', 'c', 'd', 'e', 'f'],
    });
    console.log(coreDebugger._input.join('\n'));
    const result = coreDebugger.execute();
    const expected = {
        "1:array": ["a", "b", "c", "d", "e", "f"],
        "1:key": "d",
        "2:low": 0,
        "3:high": 5,
        "5:mid": [2, 3],
        "6:value": ["c", "d"],
        "8:low": 1
    };
    expect(result).toStrictEqual(expected);
});
