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
import {CodeGenTemplates, CodeNode, injectPostfix, injectPrefix} from "../generator/templates";
import {DebugObject, N, PureType, StringMap} from "../types";
import {Generator} from "../generator";


export class CoreDebugger {
    public generator: Generator;

    codeGenerate(input: string, vars: StringMap<PureType> = {}) {
        this.generator = new Generator(input, vars);
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
            this.generator.insert(CodeGenTemplates.identifier(param));
        });

        this.processBlockStatement(node.body as N<BlockStatement>);

        this.generator.insertFunctionExecute(node, params);
    }

    private processExpressionStatement(node: N<ExpressionStatement>) {
        this.processExpression(node.expression as N<Expression>);
    }

    private processExpression(node: N<Expression>) {
        switch (node.type) {
            case "AssignmentExpression":
                this.generator.insert(CodeGenTemplates.identifier(node.left as N<Identifier>));
                break;
            case "CallExpression":
                node.arguments.forEach(arg => {
                    this.processArrowFunctionExpression(arg as N<ArrowFunctionExpression>);
                });
                break;
            case "MemberExpression":
                throw new Error("Not implemented");
                break;
        }
    }

    private processArrowFunctionExpression(node: N<ArrowFunctionExpression>) {
        if (node.expression) {
            throw new Error("Not implemented");
        }
        if (node.body) {
            this.processBlockStatement(node.body as N<BlockStatement>);
        }
    }

    private processReturnStatement(node: N<ReturnStatement>) {
        if (node.argument) {
            switch (node.argument.type) {
                case "Identifier":
                    this.generator.insert(CodeGenTemplates.identifier(node.argument as N<Identifier>));
                    break;
                case "Literal":
                    this.processLiteral(node.argument as N<Literal>);
                    break;
            }
        }
    }

    private processLiteral(node: N<Literal>) {
        this.generator.insert(CodeGenTemplates.literal(node));
    }
    
    private processVariableDeclaration(node: N<VariableDeclaration>) {
        node.declarations.forEach(declaration => {
            this.generator.insert(CodeGenTemplates.varDeclNode(declaration as N<VariableDeclarator>))
        });
    }

    execute(): DebugObject {
        const result = this.generator.getInput();
        const code = `${injectPrefix}${result}\n${injectPostfix}`;
        console.log(code);
        const debug = eval(code);
        console.log(debug);
        return debug;
    }
}
