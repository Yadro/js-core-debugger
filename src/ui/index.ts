import { editor } from 'monaco-editor/esm/vs/editor/editor.api';

editor.create(document.getElementById("editor"), {
    value: "function hello() {\n\talert('Hello world!');\n}",
    language: "javascript",
    minimap: {
        enabled: false,
    },
});

editor.create(document.getElementById("debug-view"), {
    value: "function hello() {\n\talert('Hello world!');\n}",
    language: "text",
    minimap: {
        enabled: false,
    },
});
