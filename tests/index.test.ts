import { CoreDebugger } from '../src';

const code = `function func(a, b) {
\tvar c = 10, i = 0;
\ta += b;
\tvar d = a + c;
\treturn d;
}`;

const result = `function func(a, b) {__$YD$__funcParam(1,'a',a);__$YD$__funcParam(1,'b',b);
\tvar c = 10, i = 0;__$YD$__varDecl(2,'c',c);__$YD$__varDecl(2,'i',i);
\ta += b;
\tvar d = a + c;__$YD$__varDecl(4,'d',d);
\treturn d;
}`;

test('CoreDebugger', () => {
    const coreDebugger = new CoreDebugger();
    coreDebugger.codeGenerate(code);
    expect(coreDebugger._input.join('\n')).toBe(result);
});
