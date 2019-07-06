import {Parser} from "acorn";
import {
    ArrowFunctionExpression,
    AssignmentExpression,
    BlockStatement,
    Expression,
    ExpressionStatement,
    ForStatement,
    Function,
    FunctionDeclaration,
    Identifier,
    IfStatement,
    Literal,
    Pattern,
    ReturnStatement,
    Statement,
    VariableDeclaration,
    VariableDeclarator
} from "estree";
import {CodeGenTemplates, CodeNode, injectPostfix, injectPrefix} from "./templates";
import {DebugObject, N, PureType, StringMap} from "./types";


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

    private processStatement(node: N<Statement>) {
        switch (node.type) {
            case "BlockStatement":
                this.processBlockStatement(node);
                break;
                
            // TODO process Declaration
            case "FunctionDeclaration":
                this.processFunctionDeclaration(node);
                break;
            case "VariableDeclaration":
                this.processVariableDeclaration(node);
                break;
            case "ExpressionStatement":
                this.processExpressionStatement(node);
                break;
            case "ReturnStatement":
                this.processReturnStatement(node);
                break;
            case "IfStatement":
                this.processIfStatement(node);
                break;
            case "ForStatement":
            case "WhileStatement":
            case "DoWhileStatement":
                if ((node as N<ForStatement>).init) {
                    this.processStatement((node as N<ForStatement>).init as N<BlockStatement>);
                }
                this.processBlockStatement(node.body as N<BlockStatement>);
                break;
        }
    }

    private processBlockStatement(node: N<BlockStatement>) {
        if (node.body) {
            node.body.forEach(body => {
                this.processStatement(body as N<Statement>);
            })
        }
    }

    private processIfStatement(node: N<IfStatement>) {
        this.processStatement(node.consequent as N<BlockStatement>);
        if (node.alternate) {
            this.processStatement(node.alternate as N<BlockStatement>);
        }
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
                    defineArguments.push(JSON.stringify(value));
                    break;
                }
            }
        });

        this._insertCode(CodeGenTemplates.runFuncForDebug(node, defineArguments));
    }

    private processExpressionStatement(node: N<ExpressionStatement>) {
        this.processExpression(node.expression as N<Expression>);
    }

    private processExpression(node: N<Expression>) {
        switch (node.type) {
            case "AssignmentExpression":
                this._insertCode(CodeGenTemplates.identifier(node.left as N<Identifier>));
                break;
            case "CallExpression":
                node.arguments.forEach(arg => {
                    this.processArrowFunctionExpression(arg as N<ArrowFunctionExpression>);
                });
        }
    }

    private processArrowFunctionExpression(node: N<ArrowFunctionExpression>) {
        this.processBlockStatement(node.body as N<BlockStatement>);
    }

    private processReturnStatement(node: N<ReturnStatement>) {
        if (node.argument) {
            switch (node.argument.type) {
                case "Identifier":
                    this._insertCode(CodeGenTemplates.identifier(node.argument as N<Identifier>));
                    break;
                case "Literal":
                    this.processLiteral(node.argument as N<Literal>);
                    break;
            }
        }
    }

    private processLiteral(node: N<Literal>) {
        this._insertCode(CodeGenTemplates.literal(node));
    }
    
    private processVariableDeclaration(node: N<VariableDeclaration>) {
        node.declarations.forEach(declaration => {
            this._insertCode(CodeGenTemplates.varDeclNode(declaration as N<VariableDeclarator>))
        });
    }

    private _insertCode(node: CodeNode) {
        this._input[node.line - 1] += node.code;
    }

    execute(): DebugObject {
        let result = this._input.join('\n');
        const code = `${injectPrefix}${result}\n${injectPostfix}`;
        console.log(code);
        const debug = eval(code);
        console.log(debug);
        return debug;
    }
}
