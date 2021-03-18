// import { IEvent, Textbox } from "fabric/fabric-impl";
import { PDFDocument, PDFFont, PDFPage, StandardFonts } from "pdf-lib";
import { Annotation, TextAnnotation } from "./Annotation";
import { selectedTool, Tool } from "./Tool";
var pdf = require('vue-pdf');

export class PDFdocument{
    static viewport: any;
    static initDocument: Function;
    modifyRef: PDFDocument | undefined;
    viewref: any;
    pages: PDFPage[] = [];
    annotations: Annotation[] = [];
    pageCanvases: fabric.Canvas[] = [];
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
        PDFdocument.initDocument.call(PDFdocument.viewport, this.viewref);
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
    initCanvases(){
        this.hovering = [];
        for (const canvas of this.pageCanvases) {
            this.hovering.push(false);
            // canvas.on('mouse:over', ()=>{
            //     this.hovering[this.pageCanvases.indexOf(canvas)] = true;
            // });
            // canvas.on('mouse:out', ()=>{
            //     this.hovering[this.pageCanvases.indexOf(canvas)] = false;
            // });
            canvas.on('mouse:down', (e)=>{
                if(e.absolutePointer == null) return;
                // var activeCanvas = this.hovering.indexOf(true);
                // for (let i = 0; i < this.pageCanvases.length; i++) {
                //     if(i == activeCanvas) continue;
                //     const cnv = this.pageCanvases[i];
                //     cnv.discardActiveObject().renderAll();
                // }
                for (const annotation of this.annotations) {
                    if(annotation.object.containsPoint(e.absolutePointer)){
                        return;
                    }
                }
                if(canvas.getActiveObjects().length == 0){
                    var options = selectedTool.defaultOptions as fabric.IObjectOptions;
                    const width = selectedTool.defaultOptions.width || 0;
                    const height = selectedTool.defaultOptions.height || 0;
                    options.top = e.absolutePointer?.y - height / 2;
                    options.left = e.absolutePointer?.x - width /2;
                    selectedTool.defaultOptions = options;
                    selectedTool.click(this, this.pageCanvases.indexOf(canvas));
                }
            });
            canvas.on('object:scaling', (e)=>{
                e.target?.setOptions({ scaleX: 1, scaleY: 1});
            });
            canvas.on('selection:updated', (e)=>{
                for (const object of this.annotations){
                    if(object instanceof TextAnnotation){
                        this.Delete(object);
                    }
                }
            });
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