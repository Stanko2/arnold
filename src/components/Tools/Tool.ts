import { fabric } from "fabric";
import { EllipseAnnotation, ImageAnnotation, LineAnnotation, RectAnnotation, TextAnnotation } from "@/Annotation";
import { PDFdocument } from "../PDFdocument";
import { getViewedDocument } from '@/Documents/DocumentManager';
import Vue from "vue";
import { Database } from "@/Db";
import eventHub from "@/Mixins/EventHub";
import type { Tool } from "@/@types";
import store from '@/Store';

var vue: Vue | null = null;

eventHub.$on('tool:init', init);
function init(VueRef: Vue | undefined = undefined) {
    if (VueRef) {
        vue = VueRef;
        TextAnnotation.toolOptions = tools[0];
        LineAnnotation.toolOptions = tools[3];
        EllipseAnnotation.toolOptions = tools[4];
        RectAnnotation.toolOptions = tools[5];
    }
    const data = store.state.settings
    if (data) {
        const prefs = data.tools.settings;
        const shortcuts = data.shortcut.settings;
        prefs.tools.forEach((tool: any, index: number) => {
            if (index < tools.length - 1) {
                tools[index].defaultOptions = Object.assign({}, tools[index].defaultOptions, tool.defaultOptions);
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
        click: async (pdf: PDFdocument, page: number, position: { x: number, y: number }): Promise<fabric.Object> => {
            console.log(pdf.pageCanvases);
            selectedTool.defaultOptions.left = position.x;
            selectedTool.defaultOptions.top = position.y;
            var annot = new TextAnnotation(page, selectedTool.defaultOptions, pdf.pageCanvases[page]);
            pdf.addAnnotation(annot);
            selectTool(tools[7]);
            if (vue)
                vue.$data.selectedTool.defaultOptions = tools.find(e => e.name == 'Text')?.defaultOptions || {};
            return annot.object;
        },
        icon: 'title',
        tooltip: 'Text',
        defaultOptions: <fabric.ITextboxOptions>{
            width: 200,
            height: 0,
            fontFamily: 'Open Sans',
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
        icon: 'brush',
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
    <Tool><unknown>{
        name: 'Photo',
        cursor: 'pointer',
        icon: 'image',
        tooltip: 'Pridat peciatku',
        shortcut: 'e',
        defaultOptions: { name: '', image: '' },
        click: async (pdf: PDFdocument, page: number, position: { x: number; y: number; }): Promise<fabric.Object> => {
            const options: fabric.IImageOptions & { image: string } = Object.assign({}, selectedTool.defaultOptions as fabric.IImageOptions & { image: string });
            console.log(selectedTool.defaultOptions);
            const template = await Database.getTemplate((options as any).image);
            const img = new Image();
            img.src = template.data.img;
            (options as any).image = template.data.img;
            const annot = new ImageAnnotation(page, options, pdf.pageCanvases[page]);
            pdf.addAnnotation(annot);
            return annot.object;
        },
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
        click: async (pdf: PDFdocument, page: number, position: { x: number, y: number }) => {
            const annot = new LineAnnotation(page, selectedTool.defaultOptions, pdf.pageCanvases[page]);
            pdf.addAnnotation(annot);
            // selectTool(tools[7]);
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
        defaultOptions: <fabric.IEllipseOptions>{
            stroke: '#000000',
            strokeWidth: 5,
        },
        click: async (pdf: PDFdocument, page: number, position: { x: number, y: number }) => {
            const options: fabric.IEllipseOptions = Object.assign({}, selectedTool.defaultOptions, { width: 30, height: 30 });
            var annot = new EllipseAnnotation(page, options, pdf.pageCanvases[page]);
            pdf.addAnnotation(annot);
            console.log(annot.object);

            selectTool(tools[7]);
            selectedTool.defaultOptions = tools.find(e => e.name == 'Circle')?.defaultOptions || {};
            return annot.object;
        },
        options: {
            hasFill: true,
            hasStroke: true,
            hasText: false,
            hasStrokeWidth: true,
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
        click: async (pdf: PDFdocument, page: number, position: { x: number, y: number }) => {
            const options: fabric.IEllipseOptions = Object.assign({}, selectedTool.defaultOptions, { width: 30, height: 30 });
            var annot = new RectAnnotation(page, options, pdf.pageCanvases[page]);
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
        click: async (pdf: PDFdocument, page: number, position: { x: number, y: number }): Promise<fabric.Group> => {
            const sign = (selectedTool.defaultOptions as any).sign
            const signTemplate = await Database.getTemplate(sign)
            const cnv = pdf.pageCanvases[page]
            const paths: fabric.Path[] = [];
            signTemplate.data.objects.forEach((e: any) => {
                e.stroke = selectedTool.defaultOptions.stroke || '#000000ff';
                e.strokeWidth = selectedTool.defaultOptions.strokeWidth || 10;
                const path = new fabric.Path(e.path, e);
                paths.push(path);
                // cnv.add(path);
                // console.log(position);
            });
            const options = selectedTool.defaultOptions;
            const grp = new fabric.Group(paths, { left: position.x, top: position.y, ...options });
            (grp as any).sign = sign;
            console.log(grp);

            cnv.add(grp);
            return grp;
        },
        options: {
            hasFill: false,
            hasStroke: true,
            hasText: false,
            hasStrokeWidth: true,
        },
        onDeselect: () => { },
        onSelect: () => { },
        mouseMove: (e: fabric.IEvent) => { },
        mouseUp: (e: fabric.IEvent) => { },
    },
    <Tool>{
        name: 'Select',
        cursor: 'pointer',
        icon: 'select_all',
        tooltip: 'Vybrat objekty',
        defaultOptions: {},
        onSelect: () => {
            selectedTool.defaultOptions = {}
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
    PDFdocument.activeObject = undefined;
    if (tool.onSelect) {
        tool.onSelect();
    }
    setTimeout(() => {
        getViewedDocument()?.pageCanvases.forEach(e => {
            e.selection = tool.name === 'Select';
            e.setSelectable(tool.name === 'Select');
            e.requestRenderAll();
        });
    }, 200);
    if (vue != null) {
        vue.$data.selectedTool = selectedTool;
        vue.$data.selectedOptions = selectedTool.options;
    }
}
