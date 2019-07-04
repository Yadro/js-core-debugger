import {Node} from "acorn";
import {Identifier, VariableDeclarator} from "estree";

export interface CodeNode {
    code: string;
    line: number;
}

const prefix = "__$YD$__";
const q = (str: string) => `'${str}'`;
const codeStatement = (funcName: string, params: (number|string)[]) => `${prefix}${funcName}(${params.join(',')});`;

export const CodeGenTemplates = {
    varDeclNode(varNode: Node & VariableDeclarator): CodeNode {
        const varId = varNode.id as Identifier;
        return ({
            code: codeStatement('varDecl', [varNode.loc.start.line, q(varId.name), varId.name]),
            line: varNode.loc.start.line,
        })
    },
    identifier(funcParamNode: Node & Identifier): CodeNode {
        return ({
            code: codeStatement('ident',
                [funcParamNode.loc.start.line, q(funcParamNode.name), funcParamNode.name]),
            line: funcParamNode.loc.start.line,
        });
    },
};
