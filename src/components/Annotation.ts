import { Canvas } from '@/Canvas';
import Color from 'color';
import { fabric } from 'fabric';
import { PDFFont, PDFPage, rgb, UnexpectedFieldTypeError } from 'pdf-lib';
import { Tool } from './Tool';

export class TextAnnotation implements Annotation{
    static toolOptions: any;
    static font: PDFFont;
    object: fabric.Textbox;
    id: string = '';
    constructor(public page:number, options: fabric.ITextboxOptions, private canvas: Canvas) {
        this.object = new fabric.Textbox('Text', options);
        (this.object as any).tool = TextAnnotation.toolOptions;
        canvas.add(this.object);
        this.options = options;
        canvas.setActiveObject(this.object);
        this.object.selectAll();
        this.object._controlsVisibility = {
            bl: false,
            br: false,
            mtr: false,
            tl: false,
            tr: false,
            mb: false,
            mt: false,
        }
    }
    options: any;
    delete() {
        this.canvas.remove(this.object);
        this.canvas.renderAll();
    }
    bake(page: PDFPage){
        const {width, height} = page.getSize();
        if(this.object == null || this.object.top == null || this.object.left == null || this.object.fontSize == null) return;
        var x = this.object.left || 0;
        var y = height - (this.object.top + this.object.fontSize);
        var fontSize: number = this.object.fontSize || 14;
        var color = Color(this.object.fill).object();
        console.log(this.object.textLines);
        var options = {
            x: x,
            y: y,
            size: fontSize,
            font: TextAnnotation.font,
            color: rgb(color.r/255,color.g/255,color.b/255),
            lineHeight: this.object._fontSizeMult * fontSize,
        }
        page.drawText(this.object.textLines.join('\n'), options);
    }
}

export class RectAnnotation implements Annotation{
    static toolOptions: any;
    object: fabric.Rect;
    constructor(public page:number, options: fabric.IRectOptions, private canvas: fabric.Canvas) {
        this.object = new fabric.Rect(options);
        (this.object as any).tool = RectAnnotation.toolOptions;
        canvas.add(this.object);
        this.options = options;
        canvas.setActiveObject(this.object);
    }
    options: any;
    delete() {
        this.canvas.remove(this.object);
        this.canvas.renderAll();
    }
    bake(page: PDFPage){
        // const { width, height } = page.getSize();
        // var textbox = this.object;
        // if(textbox == null || textbox.top == null || textbox.left == null || textbox.fontSize == null) return;
        // var x = (textbox.left) / this.canvas.getWidth() * width;
        // var y = height - (textbox.top + textbox.fontSize) / this.canvas.getHeight() * height;
        // var fontSize = this.options.fontSize / this.canvas.getHeight() * height;
        // console.log(textbox.textLines);
        // var color = Color(textbox.fill).object();
        // page.drawText(textbox.textLines.join('\n'), {
        //     x: x,
        //     y: y,
        //     size: fontSize,
        //     font: TextAnnotation.font,
        //     color: rgb(color.r/255,color.g/255,color.b/255),
        //     lineHeight: textbox._fontSizeMult * fontSize,
        // })
    }
}

export class LineAnnotation implements Annotation{
    static toolOptions: any;
    object: fabric.Line;
    constructor(public page:number, options: fabric.ILineOptions, private canvas: fabric.Canvas) {
        this.object = new fabric.Line([0,0,200,200], options);
        (this.object as any).tool = LineAnnotation.toolOptions;
        canvas.add(this.object);
        this.options = options;
        canvas.setActiveObject(this.object);
    }
    options: any;
    delete() {
        this.canvas.remove(this.object);
        this.canvas.renderAll();
    }
    bake(page: PDFPage){
        // const { width, height } = page.getSize();
        // var textbox = this.object;
        // if(textbox == null || textbox.top == null || textbox.left == null || textbox.fontSize == null) return;
        // var x = (textbox.left) / this.canvas.getWidth() * width;
        // var y = height - (textbox.top + textbox.fontSize) / this.canvas.getHeight() * height;
        // var fontSize = this.options.fontSize / this.canvas.getHeight() * height;
        // console.log(textbox.textLines);
        // var color = Color(textbox.fill).object();
        // page.drawText(textbox.textLines.join('\n'), {
        //     x: x,
        //     y: y,
        //     size: fontSize,
        //     font: TextAnnotation.font,
        //     color: rgb(color.r/255,color.g/255,color.b/255),
        //     lineHeight: textbox._fontSizeMult * fontSize,
        // })
    }
}
export interface Annotation{
    page:number,
    options: any,
    bake: Function,
    object: fabric.Object,
}