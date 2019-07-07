import { editor, KeyCode } from 'monaco-editor/esm/vs/editor/editor.api';
import {CoreDebugger} from "../core/coreDebugger";
import {ViewResult} from "../core/viewResult";


class Editor {
    private viewResult = new ViewResult();
    private codeEditor: editor.IStandaloneCodeEditor;
    private debugView: editor.IStandaloneCodeEditor;

    constructor() {
        const editorId = document.getElementById("editor");
        const debugViewId = document.getElementById("debug-view");
        const debugBtnId = document.getElementById("debug");

        this.codeEditor = editor.create(editorId, {
            value: "function hello() {\n\tvar a = 1;\n\twhile(a < 10) {\n\t\ta *= 2;\n\t}\n}",
            language: "javascript",
            minimap: {
                enabled: false,
            },
        });
        this.codeEditor.addCommand(KeyCode.Ctrl | KeyCode.KEY_S, this.saveCode);
        this.restoreCode();

        this.debugView = editor.create(debugViewId, {
            language: "text",
            minimap: {
                enabled: false,
            },
            readOnly: true,
        });

        window.addEventListener("resize", () => {
            this.codeEditor.layout();
            this.debugView.layout();
        });

        debugBtnId.addEventListener("click", this.viewDebug);
        this.codeEditor.addCommand(KeyCode.US_BACKTICK, this.viewDebug);
    }

    viewDebug() {
        const coreDebugger = new CoreDebugger();
        try {
            coreDebugger.codeGenerate(this.codeEditor.getValue());
            console.log(coreDebugger.generator.getInput());
        } catch (e) {
            this.debugView.setValue("Something went wrong with code generate. Check console F12");
            return;
        }
        try {
            const debugObject = coreDebugger.execute();
            console.log(debugObject);
            this.debugView.setValue(this.viewResult.process(debugObject));
            this.saveCode();
        } catch (e) {
            this.debugView.setValue("Something went wrong with code execute. Check console F12");
        }
    }

    saveCode() {
        window.localStorage.setItem('code', this.codeEditor.getValue());
    }

    restoreCode() {
        const restoredValue = window.localStorage.getItem('code');
        if (restoredValue) {
            this.codeEditor.setValue(restoredValue);
        }
    }

}

new Editor();
