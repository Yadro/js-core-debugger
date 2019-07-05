import {Node, Parser} from "acorn";
import {
    AssignmentExpression,
    BlockStatement,
    ExpressionStatement,
    Function,
    FunctionDeclaration,
    Identifier,
    Pattern,
    ReturnStatement,
    SourceLocation,
    VariableDeclaration,
    VariableDeclarator
} from "estree";
import {CodeGenTemplates, CodeNode, injectPostfix, injectPrefix} from "./templates";
import {N, PureType, StringMap} from "./types";


export class CoreDebugger {
    public _input: string[];
    public overrideVariables: StringMap<PureType> = {};

    codeGenerate(input: string, vars: StringMap<PureType> = {}) {
        this._input = input.split('\n');
        this.overrideVariables = vars;
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
                case "ForStatement":
                case "WhileStatement":
                case "DoWhileStatement":
                    this.processBlockStatement(body.body as N<BlockStatement>);
                    break;
            }
        })
    }

    private processFunctionDeclaration(node: N<FunctionDeclaration>) {
        const params = node.params.filter(p => p.type === "Identifier") as N<Identifier>[];

        params.forEach(param => {
            this._insertCode(CodeGenTemplates.identifier(param));
        });

        this.processBlockStatement(node.body as N<BlockStatement>);

        this.insertFunctionExecute(node, params);
    }

    private insertFunctionExecute(node: N<FunctionDeclaration>, nodes: N<Identifier>[]) {
        const defineArguments: PureType[] = [];

        nodes.forEach(p => {
            for (let v in this.overrideVariables) {
                const [line, name] = v.split(':');
                const value = this.overrideVariables[v];
                if (p.loc.start.line === +line && p.name === name) {
                    defineArguments.push(value);
                    break;
                }
            }
        });

        this._insertCode(CodeGenTemplates.runFuncForDebug(node, defineArguments));
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
