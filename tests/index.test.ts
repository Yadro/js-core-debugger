import { CoreDebugger } from '../src/core/coreDebugger';
import {DebugObject} from "../src/types";

const coreDebugger = new CoreDebugger();

function generate(code: string): DebugObject {
    coreDebugger.codeGenerate(code);
    return coreDebugger.execute();
}

// language=JavaScript
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

// language=JavaScript
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
    const expected = resultCode.concat(`;__$YD$__exec(1,'search',search,[]);`);
    expect(coreDebugger.generator.getInput()).toBe(expected);
});

test('Parse and Execute', () => {
    const coreDebugger = new CoreDebugger();
    coreDebugger.codeGenerate(code, {
        "1:key": 'b',
        "1:array": ['a', 'b', 'c', 'd', 'e', 'f'],
    });
    const expectedCode = resultCode.concat(`;__$YD$__exec(1,'search',search,["b",["a","b","c","d","e","f"]]);`);
    expect(coreDebugger.generator.getInput()).toBe(expectedCode);

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
test('Test code with loops', () => {
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

// language=JavaScript
const codeWithLambda = `
function test() {
    var r = 0;
    var arr = [1, 2, 3];
    arr.forEach(i => {
        r += i;
    });
    var m = arr.map(i => i + r);
}`;
test('Test code with lambda', () => {
    const result = generate(codeWithLambda);
    const expected = {
        "3:r": [0],
        "4:arr": [[1, 2, 3]],
        "6:r": [1, 3, 6],
        "8:m": [[7, 8, 9]]
    };
    expect(result).toStrictEqual(expected);
});


// language=JavaScript
const codeWithDeclarations = `
function test() {
    var c = {
        с: "с"
    };
    var a = {};
    var b = { b: "b" };
}`;
const expectedCodeWithDeclarations = `
function test() {
    var c = {
        с: "с"
    };__$YD$__varDecl(3,'c',c);
    var a = {};__$YD$__varDecl(6,'a',a);
    var b = { b: "b" };__$YD$__varDecl(7,'b',b);
};__$YD$__exec(2,'test',test,[]);`;
test('Test code with object declarations', () => {
    const coreDebugger = new CoreDebugger();
    coreDebugger.codeGenerate(codeWithDeclarations);
    expect(coreDebugger.generator.getInput()).toBe(expectedCodeWithDeclarations);

    const result = coreDebugger.execute();
    const expected = {
        "3:c": [{"с": "с"}],
        "6:a": [{}],
        "7:b": [{"b": "b"}]
    };
    expect(result).toStrictEqual(expected);
});


const codeWithoutSemicolon = `
function test() {
    var num = 1
    var obj = {}
    var str = ""
    var multiline = {
        a: 1,
    }
    var fn = function() {
    }
}`;
const resultCodeWithoutSemicolon = `
function test() {
    var num = 1;__$YD$__varDecl(3,'num',num);
    var obj = {};__$YD$__varDecl(4,'obj',obj);
    var str = "";__$YD$__varDecl(5,'str',str);
    var multiline = {
        a: 1,
    };__$YD$__varDecl(6,'multiline',multiline);
    var fn = function() {
    };__$YD$__varDecl(9,'fn',fn);
};__$YD$__exec(2,'test',test,[]);`;
test('Test code without semicolon', () => {
    const coreDebugger = new CoreDebugger();
    coreDebugger.codeGenerate(codeWithoutSemicolon);
    expect(coreDebugger.generator.getInput()).toBe(resultCodeWithoutSemicolon);
});
