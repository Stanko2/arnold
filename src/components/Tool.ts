import { ILineOptions, IObjectOptions, ITextboxOptions } from "fabric/fabric-impl";
import { Annotation, LineAnnotation, RectAnnotation, TextAnnotation } from "./Annotation";
import { PDFdocument } from "./PDFdocument";
import { getViewedDocument } from '@/DocumentManager';
import Vue from "*.vue";
export interface Tool {
    defaultOptions: IObjectOptions,
    click(pdf: PDFdocument, page: number, position: {x: number, y: number}): fabric.Object,
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

export function init(VueRef: Vue){
    vue = VueRef;
    TextAnnotation.toolOptions = tools[0];
    LineAnnotation.toolOptions = tools[3];
    RectAnnotation.toolOptions = tools[5];
}

export var tools: Tool[] = [
    <Tool>{
        name: 'Text',
        cursor: 'pointer',
        click: (pdf: PDFdocument, page: number, position: {x: number, y: number}): fabric.Object => {
            console.log(pdf.pageCanvases);
            
            var annot = new TextAnnotation(page, selectedTool.defaultOptions, pdf.pageCanvases[page]);
            pdf.addAnnotation(annot);
            selectTool(tools[7]);
            selectedTool.defaultOptions = tools.find(e=>e.name == 'Text')?.defaultOptions || {};
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
        shortcut: 't',
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
                e.isDrawingMode = true;                
                var ref = tools.find(e=>e.name == 'Draw');
                e.freeDrawingBrush.color = ref?.defaultOptions.stroke || '#000000';
                e.freeDrawingBrush.width = ref?.defaultOptions.strokeWidth || 10;
            });
        },
        onDeselect: () => {
            getViewedDocument()?.pageCanvases.forEach((e) => {
                e.isDrawingMode = false;
                console.log(e);
                
            });
        },
        options: {
            hasFill: false,
            hasStroke: true,
            hasStrokeWidth: true,
            hasText: false,
        },
        shortcut: 'd'
    },
    <Tool>{
        name: 'Photo',
        cursor: 'pointer',
        icon: 'add_photo_alternate',
        tooltip: 'Pridat peciatku',
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
        defaultOptions: <ILineOptions>{
            stroke: '#000000',
            strokeWidth: 5,
        },
        click: (pdf: PDFdocument, page: number, position: {x: number, y: number}) => {
            var options = (selectedTool.defaultOptions as fabric.ILineOptions);
            options.x1 = position.x;
            options.y1 = position.y;
            var annot = new LineAnnotation(page, selectedTool.defaultOptions, pdf.pageCanvases[page]);
            pdf.addAnnotation(annot);
            // selectTool(tools[7]);
            selectedTool.defaultOptions = tools.find(e=>e.name == 'Arrow')?.defaultOptions || {};
            console.log(annot.object);
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
        click: (pdf: PDFdocument, page: number, position: {x: number, y: number}) => {
            var annot = new RectAnnotation(page, selectedTool.defaultOptions, pdf.pageCanvases[page]);
            pdf.addAnnotation(annot);
            selectTool(tools[7]);
            selectedTool.defaultOptions = tools.find(e=>e.name == 'Rect')?.defaultOptions || {};
            return annot.object;
        },
        options: {
            hasFill: true,
            hasStroke: true,
            hasStrokeWidth: true,
            hasText: false,
        },
        shortcut: 'r',
    },
    <Tool>{
        name: 'Sign',
        cursor: 'pointer',
        icon: 'edit',
        tooltip: 'Pridat podpis',
        options: {
            hasFill: false,
            hasStroke: false,
            hasText: false,
            hasStrokeWidth: false,
        }
    },
    <Tool><unknown>{
        name: 'Select',
        cursor: 'pointer',
        icon: 'select_all',
        tooltip: 'Vybrat objekty',
        defaultOptions: {},
        onSelect: () => {
            getViewedDocument()?.pageCanvases.forEach((e)=>{
                e.selection = true;
            })
        },
        onDeselect: () => {
            getViewedDocument()?.pageCanvases.forEach((e)=>{
                e.selection = false;
            })
        },
        options: {
            hasFill: false,
            hasStroke: false,
            hasStrokeWidth: false,
            hasText: false,
        },
        shortcut: 's',
    },
]

export var selectedTool: Tool = tools[1];

export function selectTool(tool: Tool){
    selectedTool?.onDeselect?.();
    selectedTool = tool;
    if(tool.onSelect){
        tool.onSelect();
    }
    if(vue!= null) {
        vue.$data.selectedTool = selectedTool;
        vue.$data.selectedOptions = selectedTool.options;
    }
}
