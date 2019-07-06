import { FunctionDeclaration, Identifier, Literal, VariableDeclarator } from "estree";
import { N, PureType } from "./types";

export interface CodeNode {
    code: string;
    line: number;
}

const prefix = "__$YD$__";
const q = (str: string) => `'${str}'`;
const arr = (str: string) => `[${str}]`;
const defineFn = (funcName: string, params: PureType[]) => `${prefix}${funcName}(${params.join(',')});`;

export const CodeGenTemplates = {
    varDeclNode(node: N<VariableDeclarator>): CodeNode {
        const varId = node.id as Identifier;
        return ({
            code: defineFn('varDecl', [node.loc.start.line, q(varId.name), varId.name]),
            line: node.loc.end.line,
        });
    },
    identifier(node: N<Identifier>): CodeNode {
        return ({
            code: defineFn('ident',
                [node.loc.start.line, q(node.name), node.name]),
            line: node.loc.start.line,
        });
    },
    literal(node: N<Literal>): CodeNode {
        return ({
            code: defineFn('ident',
                [node.loc.start.line, q('return'), JSON.stringify(node.value)]),
            line: node.loc.start.line,
        });
    },
    runFuncForDebug(node: N<FunctionDeclaration>, args: PureType[]) {
        let strArguments = '';
        if (args.length) {
            strArguments = args.join(',');
        }
        const fnName = node.id.name;
        return ({
            code: defineFn('exec', [node.body.loc.start.line, q(fnName), fnName, arr(strArguments)]),
            line: node.body.loc.end.line,
        });
    }
};

// language=JavaScript
export const injectPrefix = `
var __$YD$__result = {};
function __$YD$__ident(line, identifier, value) {
    var key = '' + line + ':' + identifier;
    if (__$YD$__result[key] && Array.isArray(__$YD$__result[key])) {
        __$YD$__result[key].push(value);
    } else {
        __$YD$__result[key] = [value];
    }
}
var __$YD$__varDecl = __$YD$__ident;
function __$YD$__exec(line, fnName, fn, args) {
    try {
        fn.apply(null, args);
    } catch(err) {
        var key = '' + line + ':' + fnName;
        __$YD$__result[key] = err.toString();
    }
}
`;
export const injectPostfix = `__$YD$__result;`;