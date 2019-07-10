import {Parser} from "acorn";
import {
    ArrowFunctionExpression,
    AssignmentExpression,
    BlockStatement,
    ClassDeclaration,
    Expression,
    ExpressionStatement,
    ForStatement,
    FunctionDeclaration,
    FunctionExpression,
    Identifier,
    IfStatement,
    Literal,
    MemberExpression,
    ReturnStatement,
    Statement,
    Super,
    SwitchStatement,
    TryStatement,
    VariableDeclaration,
    VariableDeclarator
} from "estree";
import {CodeGenTemplates, injectPostfix, injectPrefix} from "../generator/templates";
import {DebugObject, N, PureType, StringMap} from "../types";
import {Generator} from "../generator";
import {safeEval} from "../utils/safeEval";


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
            case "EmptyStatement":
            case "DebuggerStatement":
            case "WithStatement":
            case "LabeledStatement":
            case "BreakStatement":
            case "ContinueStatement":
            case "ThrowStatement":
                // ignore
                break;
            case "ExpressionStatement":
                this.processExpressionStatement(node);
                break;
            case "BlockStatement":
                this.processBlockStatement(node);
                break;
            case "ReturnStatement":
                this.processReturnStatement(node);
                break;
            case "IfStatement":
                this.processIfStatement(node);
                break;
            case "SwitchStatement":
                this.processSwitchStatement(node);
                break;
            case "TryStatement":
                this.processTryStatement(node);
                break;
            case "WhileStatement":
            case "DoWhileStatement":
            case "ForStatement":
                if ((node as N<ForStatement>).init) {
                    this.processStatement((node as N<ForStatement>).init as N<BlockStatement>);
                }
                this.processBlockStatement(node.body as N<BlockStatement>);
                break;
            case "ForInStatement":
            case "ForOfStatement":
                if (node.left.type === "VariableDeclaration") {
                    this.processVariableDeclaration(node.left as N<VariableDeclaration>);
                }
                this.processBlockStatement(node.body as N<BlockStatement>);
                break;
            case "FunctionDeclaration":
                this.processFunctionDeclaration(node);
                break;
            case "VariableDeclaration":
                this.processVariableDeclaration(node);
                break;
            case "ClassDeclaration":
                this.processClassDeclaration(node);
                break;
        }
    }

    private processExpression(node: N<Expression>) {
        switch (node.type) {
            case "ArrayExpression":
            case "ArrowFunctionExpression":
            case "AwaitExpression":
            case "ClassExpression":
            case "MetaProperty": // ??
            case "TaggedTemplateExpression": // ??
            case "NewExpression":
            case "SequenceExpression": // ??
            case "ObjectExpression":
            case "ThisExpression":
            case "UnaryExpression":
                // ignore it
                break;
            case "AssignmentExpression":
            case "BinaryExpression":
                this.processExpression(node.left as N<Expression>);
                break;
            case "CallExpression":
                node.arguments.forEach(arg => {
                    this.processArrowFunctionExpression(arg as N<ArrowFunctionExpression>); // TODO
                });
                this.processExpressionOrSuper(node.callee as N<Expression>);
                break;
            case "ConditionalExpression":
                break;
            case "FunctionExpression":
                break;
            case "Identifier":
                this.generator.insert(CodeGenTemplates.identifier(node));
                break;
            case "Literal":
                this.generator.insert(CodeGenTemplates.literal(node));
                break;
            case "LogicalExpression":
                break;
            case "MemberExpression":
                this.processMemberExpression(node as N<MemberExpression>);
                break;
            case "TemplateLiteral":
                break;
            case "UpdateExpression":
                break;
            case "YieldExpression":
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

    private processSwitchStatement(node: N<SwitchStatement>) {
        node.cases.forEach($case => {
            $case.consequent.forEach(node => {
                // TODO "case 1:var a=1;break;" won't works
                this.processStatement(node as N<Statement>);
            });
        });
    }

    private processTryStatement(node: N<TryStatement>) {
        this.processBlockStatement(node.block as N<BlockStatement>);
        if (node.handler) {
            // TODO node.handler.param
            this.processBlockStatement(node.handler.body as N<BlockStatement>);
        }
        if (node.finalizer) {
            this.processBlockStatement(node.finalizer as N<BlockStatement>);
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

    private processClassDeclaration(node: N<ClassDeclaration>) {
        node.body.body.forEach(n => {
            this.processFunctionExpression(n.value as N<FunctionExpression>);
        });
    }

    private processFunctionExpression(node: N<FunctionExpression>) {
        this.processBlockStatement(node.body as N<BlockStatement>);
    }

    private processExpressionStatement(node: N<ExpressionStatement>) {
        this.processExpression(node.expression as N<Expression>);
    }

    private processArrowFunctionExpression(node: N<ArrowFunctionExpression>) {
        if (node.body) {
            this.processBlockStatement(node.body as N<BlockStatement>);
        }
    }

    private processExpressionOrSuper(node: N<Expression | Super>) {
        if (node.type !== "Super") {
            this.processExpression(node);
        }
    }

    private processMemberExpression(node: N<MemberExpression>) {
        const name = this.getMemberExpressionName(node);
        if (typeof name === "string") {
            this.generator.insert(CodeGenTemplates.memberExpression(name, node.loc.end.line));
        }
    }

    private getMemberExpressionName(node: N<MemberExpression>): string | boolean {
        if (node.object.type === "ThisExpression" && node.property.type === "Identifier") {
            return `this.${node.property.name}`;
        } else if (node.object.type === "Identifier" && node.property.type === "Identifier") {
            // TODO find better way to handle it
            if (['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'].includes(node.property.name)) {
                return node.object.name;
            }
            if (['forEach'].includes(node.property.name)) {
                return false; // Ignore this methods
            }
            return `${node.object.name}.${node.property.name}`;
        } else if (node.object.type === "MemberExpression" && node.property.type === "Identifier") {
            return `${this.getMemberExpressionName(node.object as N<MemberExpression>)}.${node.property.name}`;
        } else {
            return false;
        }
    }

    private processReturnStatement(node: N<ReturnStatement>) {
        if (node.argument) {
            this.processExpression(node.argument as N<Expression>);
        }
    }

    private processVariableDeclaration(node: N<VariableDeclaration>) {
        node.declarations.forEach(declaration => {
            this.generator.insert(CodeGenTemplates.varDeclNode(declaration as N<VariableDeclarator>))
        });
    }

    async execute(): Promise<DebugObject> {
        const result = this.generator.getInput();
        const code = `${injectPrefix}${result}\n${injectPostfix}`;
        return await safeEval<DebugObject>(code);
    }
}
