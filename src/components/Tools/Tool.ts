import { fabric } from "fabric";
import { Annotation, LineAnnotation, PathAnnotation, RectAnnotation, TextAnnotation } from "@/Annotation";
import { PDFdocument } from "../PDFdocument";
import { getViewedDocument } from '@/DocumentManager';
import Vue from "vue";
import { Database } from "@/Db";
import eventHub from "@/EventHub";
export interface Tool {
    defaultOptions: fabric.IObjectOptions,
    click(pdf: PDFdocument, page: number, position: { x: number, y: number }): fabric.Object,
    mouseMove: Function,
    mouseUp: Function,
    cursor: string,
    icon: string,
    name: string,
    tooltip: string,
    onSelect(): void,
    onDeselect(): void,
    options: any,
    shortcut: string,
}
var vue: Vue | null = null;

eventHub.$on('tool:init', init);
function init(VueRef: Vue | undefined = undefined) {
    if (VueRef) {
        vue = VueRef;
        TextAnnotation.toolOptions = tools[0];
        LineAnnotation.toolOptions = tools[3];
        RectAnnotation.toolOptions = tools[5];
    }
    const data = localStorage.getItem('preferences')
    if (data) {
        const prefs = JSON.parse(data).tools.settings;
        const shortcuts = JSON.parse(data).shortcut.settings;
        prefs.tools.forEach((tool: any, index: number) => {
            if (index < tools.length - 1) {
                tools[index].defaultOptions = {};
                tools[index].defaultOptions = tool.defaultOptions;
            }
        });
        shortcuts.forEach((shortcut: any) => {
            const tool = tools.find(e => e.name == shortcut.name)
            if (tool) {
                tool.shortcut = shortcut.shortcut;
            }
        });


        selectTool(tools[prefs.defaultTool.value]);
    }
    else {
        selectTool(tools[0]);
    }
}
eventHub.$on('editor:documentChanged', () => { selectTool(selectedTool); });

export const tools: Tool[] = [
    <Tool>{
        name: 'Text',
        cursor: 'pointer',
        click: (pdf: PDFdocument, page: number, position: { x: number, y: number }): fabric.Object => {
            console.log(pdf.pageCanvases);

            var annot = new TextAnnotation(page, selectedTool.defaultOptions, pdf.pageCanvases[page]);
            pdf.addAnnotation(annot);
            selectTool(tools[7]);
            if (vue)
                vue.$data.selectedTool.defaultOptions = tools.find(e => e.name == 'Text')?.defaultOptions || {};
            return annot.object;
        },
        icon: 'A',
        tooltip: 'Text',
        defaultOptions: <fabric.ITextboxOptions>{
            width: 0,
            height: 0,
            fontFamily: 'Helvetica',
            fill: '#000000',
            fontSize: 12
        },
        options: {
            hasFill: true,
            hasStroke: false,
            hasText: true,
            hasStrokeWidth: false,
        },
        shortcut: 'q',
    },
    <Tool>{
        name: 'Draw',
        cursor: 'pointer',
        icon: 'draw',
        tooltip: 'Kreslit',
        defaultOptions: {
            stroke: '#000000',
            strokeWidth: 10,
        },
        onSelect: () => {
            getViewedDocument()?.pageCanvases.forEach((e) => {
                const ref = tools.find(e => e.name == 'Draw');
                e.freeDrawingBrush.color = ref?.defaultOptions.stroke || '#000000';
                e.freeDrawingBrush.width = ref?.defaultOptions.strokeWidth || 10;
                e.isDrawingMode = true;
            });
        },
        onDeselect: () => {
            getViewedDocument()?.pageCanvases.forEach((e) => {
                e.isDrawingMode = false;
            });
        },
        options: {
            hasFill: false,
            hasStroke: true,
            hasStrokeWidth: true,
            hasText: false,
        },
        shortcut: 'w'
    },
    <Tool>{
        name: 'Photo',
        cursor: 'pointer',
        icon: 'add_photo_alternate',
        tooltip: 'Pridat peciatku',
        shortcut: 'e',
        // TODO: add photo modal, photo embedding to pdf & photo support for canvas
        options: {
            hasFill: false,
            hasStroke: false,
            hasText: false,
            hasStrokeWidth: false,
        }
    },
    <Tool>{
        name: 'Arrow',
        cursor: 'pointer',
        icon: 'north_east',
        tooltip: 'Pridat sipku',
        shortcut: 'r',
        defaultOptions: <fabric.ILineOptions>{
            stroke: '#000000',
            strokeWidth: 5,
        },
        click: (pdf: PDFdocument, page: number, position: { x: number, y: number }) => {
            const annot = new LineAnnotation(page, selectedTool.defaultOptions, pdf.pageCanvases[page]);
            pdf.addAnnotation(annot);
            selectTool(tools[7]);
            selectedTool.defaultOptions = tools.find(e => e.name == 'Arrow')?.defaultOptions || {};
            return annot.object;
        },
        options: {
            hasFill: false,
            hasStroke: true,
            hasStrokeWidth: true,
            hasText: false,
        }
    },
    <Tool>{
        name: 'Circle',
        cursor: 'pointer',
        icon: 'circle',
        tooltip: 'Pridat kruh / elipsu',
        shortcut: 't',
        // TODO: add circle annotation class
        options: {
            hasFill: false,
            hasStroke: false,
            hasText: false,
            hasStrokeWidth: false,
        }
    },
    <Tool>{
        name: 'Rect',
        cursor: 'pointer',
        icon: 'crop_3_2',
        tooltip: 'Pridat obdlznik',
        defaultOptions: <fabric.IObjectOptions>{
            width: 30,
            height: 30,
        },
        click: (pdf: PDFdocument, page: number, position: { x: number, y: number }) => {
            var annot = new RectAnnotation(page, selectedTool.defaultOptions, pdf.pageCanvases[page]);
            pdf.addAnnotation(annot);
            selectTool(tools[7]);
            selectedTool.defaultOptions = tools.find(e => e.name == 'Rect')?.defaultOptions || {};
            return annot.object;
        },
        options: {
            hasFill: true,
            hasStroke: true,
            hasStrokeWidth: true,
            hasText: false,
        },
        shortcut: 'y',
    },
    <Tool>{
        name: 'Sign',
        cursor: 'pointer',
        icon: 'edit',
        tooltip: 'Pridat podpis',
        shortcut: 'u',
        defaultOptions: {},
        click: (pdf: PDFdocument, page: number, position: { x: number, y: number }) => {
            Database.getTemplate((selectedTool.defaultOptions as any).sign).then((sign) => {
                const cnv = pdf.pageCanvases[page]
                const paths: fabric.Path[] = [];
                sign.data.objects.forEach((e: any) => {
                    e.stroke = selectedTool.defaultOptions.stroke || '#000000';
                    e.strokeWidth = selectedTool.defaultOptions.strokeWidth || 10;
                    const path = new fabric.Path(e.path, e);
                    paths.push(path);
                    // cnv.add(path);
                    // console.log(position);
                });

                cnv.add(new fabric.Group(paths, { left: position.x, top: position.y }))
            });
        },
        options: {
            hasFill: false,
            hasStroke: true,
            hasText: false,
            hasStrokeWidth: true,
        }
    },
    <Tool>{
        name: 'Select',
        cursor: 'pointer',
        icon: 'select_all',
        tooltip: 'Vybrat objekty',
        defaultOptions: {},
        onSelect: () => {
            getViewedDocument()?.pageCanvases.forEach((e) => {
                e.selection = true;
            })
        },
        onDeselect: () => {
            getViewedDocument()?.pageCanvases.forEach((e) => {
                e.selection = false;
            })
        },
        options: {
            hasFill: false,
            hasStroke: false,
            hasStrokeWidth: false,
            hasText: false,
        },
        shortcut: 'i',
    },
]

let selectedTool: Tool = tools[1];

eventHub.$on('tool:select', selectTool);
eventHub.$on('tool:initCurrent', () => selectTool(selectedTool));
function selectTool(tool: Tool) {
    selectedTool?.onDeselect?.();
    selectedTool = tool;
    if (tool.onSelect) {
        tool.onSelect();
    }
    getViewedDocument()?.pageCanvases.forEach(e => {
        e.setSelectable(tool.name === 'Select')
        e.requestRenderAll();
    });
    if (vue != null) {
        vue.$data.selectedTool = selectedTool;
        vue.$data.selectedOptions = selectedTool.options;
    }
}
