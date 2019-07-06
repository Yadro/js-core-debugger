import { CoreDebugger } from '../src';
import {DebugObject} from "../src/types";
const coreDebugger = new CoreDebugger();

function generate(code: string): DebugObject {
    coreDebugger.codeGenerate(code);
    return coreDebugger.execute();
}

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
        "1:key": 'b',
        "1:array": ['a', 'b', 'c', 'd', 'e', 'f'],
    });
    console.log(coreDebugger._input.join('\n'));
    const result = coreDebugger.execute();
    const expected = {
        "1:array": [["a", "b", "c", "d", "e", "f"]],
        "1:key": ["b"],
        "2:low": [0],
        "3:high": [5],
        "5:mid": [2, 0, 1],
        "6:value": ["c", "a", "b"],
        "8:low": [1],
        "10:high": [1],
    };
    expect(result).toStrictEqual(expected);
});


// language=JavaScript
const codeWithLoops = `
function loop() {
    var a = 10;
    for (let i = a; i > 0; i-=2) {
        a = i;
    }
    while (a < 10) {
        a = a * 2;
    }
    do {
        a -= 5;
    } while( a > 0);
    return a;
}
`;
test('Test loops', () => {
    const result = generate(codeWithLoops);
    const expected = {
        "3:a": [10],
        "4:i": [10, 8, 6, 4, 2],
        "5:a": [10, 8, 6, 4, 2],
        "8:a": [4, 8, 16],
        "11:a": [11, 6, 1, -4]
    };
    expect(result).toStrictEqual(expected);
});

// language=JavaScript
const codeWithError = `
function test() {
    throwError();
}`;
test('Test code with error', () => {
    const result = generate(codeWithError);
    const expected = {
        "2:test": "ReferenceError: throwError is not defined"
    };
    expect(result).toStrictEqual(expected);
});