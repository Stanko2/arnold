import Color from 'color';
import { fabric } from 'fabric';
import { PDFFont, PDFPage, rgb, UnexpectedFieldTypeError } from 'pdf-lib';

export class TextAnnotation implements Annotation{
    
    static font: PDFFont;
    object: fabric.Textbox;
    id: string = '';
    constructor(public page:number, options: fabric.ITextboxOptions, private canvas: fabric.Canvas) {
        this.object = new fabric.Textbox('Text', options);
        canvas.add(this.object);
        this.options = options;
        canvas.setActiveObject(this.object);
        this.object.selectAll();
    }
    x: number = 0;
    y: number = 0;
    options: any;
    save = function(){

    }
    
    load = function(){

    }
    delete() {
        this.canvas.remove(this.object);
        this.canvas.renderAll();
    }
    bake(page: PDFPage){
        const { width, height } = page.getSize();
        var textbox = this.object;
        if(textbox == null || textbox.top == null || textbox.left == null || textbox.fontSize == null) return;
        var x = (textbox.left) / this.canvas.getWidth() * width;
        var y = height - (textbox.top + textbox.fontSize) / this.canvas.getHeight() * height;
        var fontSize = this.options.fontSize / this.canvas.getHeight() * height;
        console.log(textbox.textLines);
        var color = Color(textbox.fill).object();
        page.drawText(textbox.textLines.join('\n'), {
            x: x,
            y: y,
            size: fontSize,
            font: TextAnnotation.font,
            color: rgb(color.r/255,color.g/255,color.b/255),
            lineHeight: textbox._fontSizeMult * fontSize,
        })
    }
}

export interface Annotation{
    x: number,
    y: number,
    page:number,
    options: any,
    save: Function,
    load: Function,
    bake: Function,
    object: fabric.Object,
}