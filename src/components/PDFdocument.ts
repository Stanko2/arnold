import Vue from "*.vue";
import { Canvas } from "@/Canvas";
import { fabric } from "fabric";
import { PDFDocument, PDFFont, PDFPage, StandardFonts } from "pdf-lib";
import { Annotation, TextAnnotation } from "./Annotation";
import { Tool } from "./Tool";
var pdf = require('vue-pdf');

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
    pdfbytes: ArrayBuffer | undefined;
    constructor(url: string | ArrayBuffer){
        this.init(url).then(pdf=>{
            this.pdfbytes = pdf;
            this.InitModifyRef();
        });
        this.pdfbytes = undefined;
    }

    async init(data: string | ArrayBuffer){
        var pdfbytes = data as ArrayBuffer;
        console.log('init');
        
        if(data instanceof String){
            pdfbytes = await fetch(data as string).then(res => res.arrayBuffer());
        }
        this.LoadPdfToViewport(pdfbytes);
        return pdfbytes
    }

    private async InitModifyRef() {
        if(this.pdfbytes == null) {
            console.error('PDF not loaded')
            return;    
        }
        this.modifyRef = await PDFDocument.load(this.pdfbytes);
        this.font = await this.modifyRef.embedFont(StandardFonts.Helvetica);
        TextAnnotation.font = this.font;
        this.pages = this.modifyRef.getPages();
    }

    private LoadPdfToViewport(pdfbytes: ArrayBuffer) {
        this.viewref = pdf.default.createLoadingTask(new Uint8Array(pdfbytes));
        var progressUpdated = false;
        this.viewref.onProgress = (progress: number) => {
            progressUpdated = true;
        };
        setTimeout(() => {
            if (!progressUpdated) {
                this.LoadPdfToViewport(pdfbytes);
                console.error('retry');
            }
            PDFdocument.initDocument.call(PDFdocument.viewport, this.viewref, this);
        }, 500);
    }

    write(annotation: Annotation){
        const page = this.pages[annotation.page];
        annotation.bake(page);
    }

    async save(){
        await this.InitModifyRef();
        for (const annotation of this.annotations) {
            this.write(annotation);
        }
        for (let i = 0; i < this.pageCanvases.length; i++) {
            const canvas = this.pageCanvases[i];
            for (const shape of canvas.drawnShapes) {
                const path = shape.toClipPathSVG().split('d=')[1].split('"')[1];
                console.log(path);
                this.pages[i].drawSvgPath(path, {x: 25, y: 25, borderWidth: 10});
            }
        }
        const pdfBytes = await this.modifyRef?.save();
        if(pdfBytes == null) return;
        var blob = new Blob([pdfBytes], {type: 'application/pdf'});
        var a = document.createElement("a");
        document.body.appendChild(a);
        var url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = `opravene_${Math.random() * 1000000}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        await this.InitModifyRef();
    }
    initCanvases(){
        for (const canvas of this.pageCanvases) {
            canvas.initEvents();
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