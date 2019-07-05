import {Node, Parser} from "acorn";
import {
    AssignmentExpression,
    BlockStatement, ExpressionStatement,
    Function,
    FunctionDeclaration,
    Identifier,
    Pattern,
    Program, ReturnStatement,
    SourceLocation,
    VariableDeclaration,
    VariableDeclarator
} from "estree";
import {CodeGenTemplates, CodeNode, injectPostfix, injectPrefix} from "./templates";

type N<T> = Node & T;

export class CoreDebugger {
    public _input: string[];

    codeGenerate(input: string) {
        this._input = input.split('\n');
        const parser = new Parser({ locations: true }, input);
        const astTree = parser.parse() as unknown as N<BlockStatement>;

        this.processBlockStatement(astTree);
    }

    private processBlockStatement(node: N<BlockStatement>) {
        node.body.forEach(body => {
            switch (body.type) {
                case "FunctionDeclaration":
                    this.processFunctionDeclaration(body as N<FunctionDeclaration>);
                    break;
                case "VariableDeclaration":
                    this.processVariableDeclaration(body as N<VariableDeclaration>);
                    break;
                case "ExpressionStatement":
                    this.processExpressionStatement(body as N<ExpressionStatement>);
                    break;
                case "ReturnStatement":
                    this.processReturnStatement(body as N<ReturnStatement>);
                    break;
            }
        })
    }

    private processFunctionDeclaration(node: N<FunctionDeclaration>) {
        node.params.forEach(param => {
            if (param.type === "Identifier") {
                this._insertCode(CodeGenTemplates.identifier(param as N<Identifier>));
            }
        });

        this.processBlockStatement(node.body as N<BlockStatement>);

        this._insertCode(CodeGenTemplates.runFuncForDebug(node));
    }

    private processExpressionStatement(node: N<ExpressionStatement>) {
        switch (node.expression.type) {
            case "AssignmentExpression":
                this._insertCode(CodeGenTemplates.identifier(node.expression.left as N<Identifier>));
                break;
        }
    }

    private processReturnStatement(node: N<ReturnStatement>) {
        switch (node.argument.type) {
            case "Identifier":
                this._insertCode(CodeGenTemplates.identifier(node.argument as N<Identifier>));
                break;
        }
    }

    private processVariableDeclaration(node: N<VariableDeclaration>) {
        node.declarations.forEach(declaration => {
            this._insertCode(CodeGenTemplates.varDeclNode(declaration as N<VariableDeclarator>))
        });
    }

    private _insertCode(node: CodeNode) {
        this._input[node.line - 1] += node.code;
    }

    execute() {
        let result = this._input.join('\n');
        const code = `${injectPrefix}${result}\n${injectPostfix}`;
        return eval(code);
    }
}
