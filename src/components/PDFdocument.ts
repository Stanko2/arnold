import Vue from "*.vue";
import { Canvas } from "@/Canvas";
import { fabric } from "fabric";
import { PDFDocument, PDFFont, PDFPage, StandardFonts } from "pdf-lib";
import { Annotation, TextAnnotation } from "./Annotation";
import { selectedTool, Tool } from "./Tool";
var pdf = require('vue-pdf');

interface Point{
    x: number;
    y: number;
}

export class PDFdocument{
    static viewport: Vue;
    static toolbarRef: any;
    static initDocument: Function;
    static activeObject: fabric.Object;
    modifyRef: PDFDocument | undefined;
    viewref: any;
    pages: PDFPage[] = [];
    annotations: Annotation[] = [];
    pageCanvases: Canvas[] = [];
    font: PDFFont | undefined;
    get pageCount(): number {
        return this.pages.length;
    } 
    constructor(url: string){
        this.init(url);
    }

    async init(url: string){
        var pdfbytes = await fetch(url).then(res => res.arrayBuffer());
        this.LoadPdfToViewport(pdfbytes);
        PDFdocument.initDocument.call(PDFdocument.viewport, this.viewref, this);
        this.modifyRef = await PDFDocument.load(pdfbytes);
        this.font = await this.modifyRef.embedFont(StandardFonts.Helvetica);
        TextAnnotation.font = this.font;
        this.pages = this.modifyRef.getPages();
    }

    private LoadPdfToViewport(pdfbytes: ArrayBuffer) {
        this.viewref = pdf.default.createLoadingTask(new Uint8Array(pdfbytes));
        console.log('loading');
        var progressUpdated = false;
        this.viewref.onProgress = (progress: number) => {
            progressUpdated = true;
        };
        setTimeout(() => {
            if (!progressUpdated) {
                this.LoadPdfToViewport(pdfbytes);
                console.error('retry');
            }
        }, 500);
    }

    write(annotation: Annotation){
        const page = this.pages[annotation.page];
        annotation.bake(page);
    }

    async save(){
        for (const annotation of this.annotations) {
            this.write(annotation);
        }

        const pdfBytes = await this.modifyRef?.save();
        if(pdfBytes == null) return;
        var blob = new Blob([pdfBytes], {type: 'application/pdf'});
        var a = document.createElement("a");
        document.body.appendChild(a);
        var url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = 'opravene.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    get mouseOverDocument(): boolean {
        return this.hovering.some(e=>e);
    }
    hovering: boolean[] = []
    // dragStart = <Point>{x: 0, y: 0};
    // creating: fabric.Object | null = null;
    initCanvases(){
        this.hovering = [];
        for (const canvas of this.pageCanvases) {
            this.hovering.push(false);
            canvas.initEvents();
            // canvas.on('mouse:over', ()=>{
            //     this.hovering[this.pageCanvases.indexOf(canvas)] = true;
            // });
            // canvas.on('mouse:out', ()=>{
            //     this.hovering[this.pageCanvases.indexOf(canvas)] = false;
            // });
            // canvas.on('mouse:down', (e)=>{
            //     if(e.absolutePointer == null) return;
            //     if(canvas.isDrawingMode) return;
            //     for (const annotation of this.annotations) {
            //         if(annotation.object.containsPoint(e.absolutePointer)){
            //             return;
            //         }
            //     }
            //     if(selectedTool.name != 'select' && canvas.getActiveObjects().length == 0 && selectedTool.defaultOptions != null){
            //         var options = selectedTool.defaultOptions as fabric.IObjectOptions;
            //         const width = selectedTool.defaultOptions.width || 0;
            //         const height = selectedTool.defaultOptions.height || 0;
            //         options.top = e.absolutePointer?.y - height / 2;
            //         options.left = e.absolutePointer?.x - width /2;
            //         selectedTool.defaultOptions = options;
            //         this.dragStart = <Point>{x:e.absolutePointer.x, y:e.absolutePointer.y};
            //         this.creating = selectedTool.click?.(this, this.pageCanvases.indexOf(canvas));
            //         if(selectedTool.name == 'Arrow'){
            //             (selectedTool.defaultOptions as ILineOptions).x1 = e.absolutePointer.x;
            //             (selectedTool.defaultOptions as ILineOptions).y1 = e.absolutePointer.y;
            //         }
            //     }
                
            // });
            // canvas.on('object:scaling', (e)=>{
            //     if(e.target?.type == 'textbox' || e.target?.type == 'active selection'){
            //         e.target?.setOptions({ scaleX: 1, scaleY: 1});
            //     }
                
            // });
            // canvas.on('object:scaled', (e)=>{
            //     if(e.target != null){    
            //         var obj: fabric.Object = e.target,
            //         w = (obj.width || 0) * (obj.scaleX || 0),
            //         h = (obj.height || 0) * (obj.scaleY || 0),
            //         s = obj.strokeWidth || 0;
            
            //         obj.set({
            //             'height'     : h,
            //             'width'      : w,
            //             'scaleX'     : 1,
            //             'scaleY'     : 1
            //         });
            //     }
            // });
            // canvas.on('mouse:move', (e)=>{
            //     if(this.creating != null){
            //         if(this.creating.type == 'line'){
            //             (this.creating as fabric.Line).y2 = this.dragStart.y - (e.absolutePointer?.y || 0);
            //             (this.creating as fabric.Line).x2 = this.dragStart.x - (e.absolutePointer?.x || 0);
            //             return;
            //         }
            //         this.creating.set({
            //             'height': Math.abs(this.dragStart.y - (e.absolutePointer?.y || 0)),
            //             'width': Math.abs(this.dragStart.x - (e.absolutePointer?.x || 0)),
            //         })
            //     }
            // });
            // canvas.on('mouse:up', (e) =>{
            //     this.creating = null;
            //     this.dragStart = <Point>{x:0, y:0};
            // });
            // canvas.on('selection:created', (e) =>{
            //     if(selectedTool.name == 'Select'){
            //         PDFdocument.activeObject = canvas.getActiveObject();
            //         var activeObjectTool = (canvas.getActiveObject() as any).tool;
            //         PDFdocument.toolbarRef.$data.selectedTool.defaultOptions = activeObjectTool.defaultOptions;
            //         PDFdocument.toolbarRef.$data.selectedOptions = activeObjectTool.options;

            //     }
                
            // });
        }
    }

    public Delete(object: Annotation) {
        var textbox = object as TextAnnotation;
        if (textbox.object.text === '') {
            textbox.delete();
            this.annotations.splice(this.annotations.indexOf(textbox), 1);
        }
    }

    addAnnotation(annotation: Annotation){
        this.annotations.push(annotation);
    }

    onToolSelect(tool: Tool){
        tool.onSelect(this);
    }   
}