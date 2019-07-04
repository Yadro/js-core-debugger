import {Node, Parser} from "acorn";
import {
    BlockStatement,
    Function,
    FunctionDeclaration,
    Identifier,
    Pattern,
    Program,
    SourceLocation,
    VariableDeclaration,
    VariableDeclarator
} from "estree";
import {CodeGenTemplates, CodeNode} from "./templates";

export class CoreDebugger {
    public _input: string[];

    codeGenerate(input: string) {
        this._input = input.split('\n');
        const parser = new Parser({ locations: true }, input);
        const astTree = parser.parse() as unknown as Program;

        this.processProgram(astTree);
    }

    processProgram(programNode: Program) {
        programNode.body.forEach((funcNode: Node & FunctionDeclaration) => {
            if (funcNode.type === "FunctionDeclaration") {
                this.processFuncNode(funcNode);
            }
        })
    }

    processFuncNode(funcNode: (Node & FunctionDeclaration)) {
        const _paramNodes: CodeNode[] = [];

        funcNode.params.forEach((paramNode: Node & Identifier) => {
            if (paramNode.type === "Identifier") {
                console.log(paramNode);
                _paramNodes.push(CodeGenTemplates.funcParamNode(paramNode));
            }
        });

        const funcBodyNode = funcNode.body as Node & BlockStatement;

        _paramNodes.forEach(param => {
            this.insertCode(param);
        });

        this.processBlockStatementNode(funcBodyNode);
    }

    processBlockStatementNode(blockNode: (Node & BlockStatement)) {
        blockNode.body.forEach(node => {
            if (node.type === "VariableDeclaration") {
                const varDeclNode = node as Node & VariableDeclaration;
                this.processVariableDeclarationNode(varDeclNode);
            }
        })
    }

    processVariableDeclarationNode(variableNode: (Node & VariableDeclaration)) {
        const _varDeclNodes: CodeNode[] = [];

        variableNode.declarations.forEach(varDecl => {
            const varDeclNode = varDecl as Node & VariableDeclarator;
            _varDeclNodes.push(CodeGenTemplates.varDeclNode(varDeclNode))
        });

        _varDeclNodes.forEach(v => {
            this.insertCode(v);
        });
    }

    insertCode(codeNode: CodeNode) {
        this._input[codeNode.line - 1] += codeNode.code;
    }
}
