import {Node} from "acorn";
import {FunctionDeclaration, Identifier, VariableDeclarator} from "estree";

type N<T> = Node & T;

export interface CodeNode {
    code: string;
    line: number;
}

const prefix = "__$YD$__";
const q = (str: string) => `'${str}'`;
const codeStatement = (funcName: string, params: (number|string)[]) => `${prefix}${funcName}(${params.join(',')});`;

export const CodeGenTemplates = {
    varDeclNode(node: Node & VariableDeclarator): CodeNode {
        const varId = node.id as Identifier;
        return ({
            code: codeStatement('varDecl', [node.loc.start.line, q(varId.name), varId.name]),
            line: node.loc.start.line,
        })
    },
    identifier(node: Node & Identifier): CodeNode {
        return ({
            code: codeStatement('ident',
                [node.loc.start.line, q(node.name), node.name]),
            line: node.loc.start.line,
        });
    },
    runFuncForDebug(node: Node & FunctionDeclaration) {
        return ({
            code: `${node.id.name}();`,
            line: node.body.loc.end.line,
        })
    }
};

// language=JavaScript
export const injectPrefix = `
var __$YD$__result = {};
function __$YD$__ident(line, identifier, value){
    __$YD$__result['' + line + ':' + identifier] = value;
}
var __$YD$__varDecl = __$YD$__ident;
`;
// language=JavaScript
export const injectPostfix = `__$YD$__result;`;