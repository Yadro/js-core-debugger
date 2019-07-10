import { editor, KeyCode } from 'monaco-editor/esm/vs/editor/editor.api';
import {CoreDebugger} from "../core/coreDebugger";
import {ViewResult} from "../core/viewResult";


class Editor {
    private readonly viewResult = new ViewResult();
    private readonly codeEditor: editor.IStandaloneCodeEditor;
    private readonly debugView: editor.IStandaloneCodeEditor;
    private isBlackTheme = false;

    constructor() {
        this.tryToShowDebugInfo = this.tryToShowDebugInfo.bind(this);
        this.saveCode = this.saveCode.bind(this);

        const editorId = document.getElementById("editor");
        const debugViewId = document.getElementById("debug-view");

        this.codeEditor = editor.create(editorId, {
            value: "function hello() {\n\tvar a = 1;\n\twhile(a < 10) {\n\t\ta *= 2;\n\t}\n}",
            language: "javascript",
            minimap: {
                enabled: false,
            },
        });
        this.codeEditor.addCommand(KeyCode.F3, () => {
            this.isBlackTheme = !this.isBlackTheme;
            editor.setTheme(this.isBlackTheme ? 'vs-dark' : 'vs');
        });
        this.debugView = editor.create(debugViewId, {
            language: "javascript",
            minimap: {
                enabled: false,
            },
            readOnly: true,
        });

        this.restoreCode();

        window.addEventListener("resize", () => {
            this.codeEditor.layout();
            this.debugView.layout();
        });

        this.handleEditorChanges();
        this.tryToShowDebugInfo();
    }

    private handleEditorChanges() {
        let timoutId;
        this.codeEditor.onDidChangeModelContent(() => {
            if (!this.debugView) {
                return;
            }
            if (timoutId) {
                clearTimeout(timoutId);
            }
            timoutId = setTimeout(() => {
                this.tryToShowDebugInfo();
            }, 1000);
        });
    }

    private async tryToShowDebugInfo(): Promise<void> {
        const coreDebugger = new CoreDebugger();
        try {
            coreDebugger.codeGenerate(this.codeEditor.getValue());
        } catch (e) {
            if (e.name === "SyntaxError") {
                this.debugView.setValue("Can't parse it");
                return;
            }
            this.debugView.setValue("Something went wrong with code generate. Check console F12");
            return;
        }
        try {
            const debugObject = await coreDebugger.execute();
            this.debugView.setValue(this.viewResult.process(debugObject));
            this.saveCode();
            return;
        } catch (e) {
            this.debugView.setValue("Something went wrong with code execute. Check console F12");
            return;
        }
    }

    private saveCode() {
        window.localStorage.setItem('code', this.codeEditor.getValue());
    }

    private restoreCode() {
        const restoredValue = window.localStorage.getItem('code');
        if (restoredValue) {
            this.codeEditor.setValue(restoredValue);
        }
    }

}

new Editor();
