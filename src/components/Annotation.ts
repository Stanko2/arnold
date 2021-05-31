import { Canvas } from '@/Canvas';
import { fabric } from 'fabric';
import Color from 'color';
import { PDFFont, PDFPage, rgb, stroke, UnexpectedFieldTypeError } from 'pdf-lib';
import { Tool } from './Tool';


export abstract class Annotation{

    constructor(public page:number, public object: fabric.Object, public canvas: Canvas, private type: string) {
        canvas.add(this.object);
    }

    public abstract bake(page: PDFPage) : void;

    public serializeToJSON(): any {
        return {
            page: this.page,
            type: this.type,
            data: this.object.toJSON()
        }
    }
}
export class TextAnnotation extends Annotation{
    static toolOptions: any;
    static font: PDFFont;
    get textbox(): fabric.Textbox{
        return this.object as fabric.Textbox;
    }
    constructor(page:number, options: fabric.ITextboxOptions, canvas: Canvas) {
        super(page, new fabric.Textbox('text', options), canvas, 'Text');
        (this.object as any).tool = TextAnnotation.toolOptions;

        canvas.add(this.object);
        this.options = options;
        canvas.setActiveObject(this.object);
        this.textbox.selectAll();
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
        console.log('writing text');
        
        const {width, height} = page.getSize();
        if(this.object == null || this.object.top == null || this.object.left == null || this.textbox.fontSize == null) return;
        var x = this.object.left || 0;
        var y = height - (this.object.top + this.textbox.fontSize);
        var fontSize: number = this.textbox.fontSize || 14;
        var color = Color(this.object.fill).object();
        console.log(this.textbox.textLines);
        var options = {
            x: x,
            y: y,
            size: fontSize,
            font: TextAnnotation.font,
            color: rgb(color.r/255,color.g/255,color.b/255),
            lineHeight: this.textbox._fontSizeMult * fontSize,
        }
        page.drawText(this.textbox.textLines.join('\n'), options);
    }
}

export class RectAnnotation extends Annotation{
    static toolOptions: any;
    constructor(page:number, options: fabric.IRectOptions, canvas: Canvas) {
        super(page, new fabric.Rect(options), canvas, 'Rect');
        this.object = new fabric.Rect(options);
        (this.object as any).tool = RectAnnotation.toolOptions;
        this.options = options;
        canvas.setActiveObject(this.object);
    }
    options: any;
    delete() {
        this.canvas.remove(this.object);
        this.canvas.renderAll();
    }
    bake(page: PDFPage){
        var fill: Color = Color(this.object.fill);
        var stroke: Color = Color(this.object.stroke);
        const { width, height} = page.getSize();
        console.log(`drawing rectangle at ${this.object.left}, ${this.object.top}`);
        console.log(`width: ${width} height ${height}`);
        
        page.drawRectangle({
            borderColor: rgb(stroke.red()/255, stroke.green()/255, stroke.blue() / 255),
            color: rgb(fill.blue() / 255, fill.green() / 255, fill.blue() / 255),
            borderWidth: this.object.strokeWidth,
            height: this.object.height,
            width: this.object.width,
            x: this.object.left,
            y: height - (this.object.top || 0) - (this.object.height || 0),
        })
    }
}

export class LineAnnotation extends Annotation{
    static toolOptions: any;
    start: fabric.Circle;
    end: fabric.Circle;
    constructor(page:number, options: fabric.ILineOptions, canvas: Canvas) {
        options.hasControls = false;
        options.hasBorders = false;
        super(page, new fabric.Line([options.x1 || 0, options.y1 || 0,options.x1 || 0, options.y1 || 0], options), canvas, 'Line');
        (this.object as any).tool = LineAnnotation.toolOptions;
        
        
        this.start = new fabric.Circle({top: options.y1, left: options.x1, radius: 10, fill: '#ff0000', hasControls: false, hasBorders: false});
        this.end = new fabric.Circle({top: options.y1, left: options.x1, radius: 10, fill: '#ff0000', hasControls: false, hasBorders: false});
        
        this.object.lockMovementX = true;
        this.object.lockMovementY = true;
        this.start.on('moving', (e)=>{
            (this.object as fabric.Line).set({
                x1: this.start.left as number + (this.start.radius as number),
                y1: this.start.top as number + (this.start.radius as number),
            })
        });
        this.end.on('moving', (e)=>{
            (this.object as fabric.Line).set({
                x2: this.end.left as number + (this.end.radius as number),
                y2: this.end.top as number + (this.end.radius as number),
            })
        })
        canvas.add(this.start);
        canvas.add(this.end);
        canvas.bringToFront(this.end);
        canvas.setActiveObject(this.end);
        this.options = options;
        canvas.setActiveObject(this.object);
    }
    updatePoints(){
    }
    options: any;
    delete() {
        this.canvas.remove(this.object);
        this.canvas.renderAll();
    }
    bake(page: PDFPage){
        var stroke: Color = Color(this.object.stroke);
        const { width, height} = page.getSize();
        var line = this.object as fabric.Line;
        page.drawLine({
            start: {
                x: line.x1 || 0,
                y: height - (line.y1 || 0)
            },
            end: {
                x: line.x2 || 0, 
                y: height - (line.y2 || 0)
            },
            color: rgb(stroke.red()/255, stroke.green()/255, stroke.blue()/255),
            thickness: this.object.strokeWidth,
        });
    }
}
