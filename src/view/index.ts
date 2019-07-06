import { editor, KeyCode } from 'monaco-editor/esm/vs/editor/editor.api';
import {CoreDebugger} from "../index";
import {ViewResult} from "../viewResult";


const viewResult = new ViewResult();

const codeEditor = editor.create(document.getElementById("editor"), {
    value: "function hello() {\n\tvar a = 1;\n\twhile(a < 10) {\n\t\ta *= 2;\n\t}\n}",
    language: "javascript",
    minimap: {
        enabled: false,
    },
});

restoreCode();

const debugView = editor.create(document.getElementById("debug-view"), {
    language: "text",
    minimap: {
        enabled: false,
    },
    readOnly: true,
});

const debugBtn = document.getElementById("debug");

debugBtn.addEventListener("click", viewDebug);

codeEditor.addCommand(KeyCode.US_BACKTICK, viewDebug);

function viewDebug() {
    const coreDebugger = new CoreDebugger();
    try {
        coreDebugger.codeGenerate(codeEditor.getValue());
        console.log(coreDebugger._input);
    } catch (e) {
        debugView.setValue("Something went wrong with code generate. Check console F12");
        return;
    }
    try {
        const debugObject = coreDebugger.execute();
        console.log(debugObject);
        debugView.setValue(viewResult.process(debugObject));
        saveCode();
    } catch (e) {
        debugView.setValue("Something went wrong with code execute. Check console F12");
    }
}

codeEditor.addCommand(KeyCode.Ctrl | KeyCode.KEY_S, saveCode);

function saveCode() {
    window.localStorage.setItem('code', codeEditor.getValue());
}

function restoreCode() {
    const restoredValue = window.localStorage.getItem('code');
    if (restoredValue) {
        codeEditor.setValue(restoredValue);
    }
}
