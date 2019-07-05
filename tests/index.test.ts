import { CoreDebugger } from '../src';

const code = `function func(a, b) {
\tvar c = 10, i = 0;
\ta += b;
\tvar d = a + c;
\treturn d;
}`;

const resultCode = `function func(a, b) {__$YD$__ident(1,'a',a);__$YD$__ident(1,'b',b);
\tvar c = 10, i = 0;__$YD$__varDecl(2,'c',c);__$YD$__varDecl(2,'i',i);
\ta += b;__$YD$__ident(3,'a',a);
\tvar d = a + c;__$YD$__varDecl(4,'d',d);
\treturn d;__$YD$__ident(5,'d',d);
}`;

test('Parse code', () => {
    const coreDebugger = new CoreDebugger();
    coreDebugger.codeGenerate(code);
    const expected = resultCode.concat('func();');
    expect(coreDebugger._input.join('\n')).toBe(expected);
});

test('Parse and Execute', () => {
    const coreDebugger = new CoreDebugger();
    coreDebugger.codeGenerate(code, {
        "1:a": 1,
        "1:b": 2,
    });
    const result = coreDebugger.execute();
    const expected = {
        "1:a": 1,
        "1:b": 2,
        "2:c": 10,
        "2:i": 0,
        "3:a": 3,
        "4:d": 13
    };
    expect(result).toStrictEqual(expected);
});
