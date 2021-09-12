import { Canvas } from "@/Canvas";
import { Annotation } from "./Annotation";
import { EmbedFont } from "@/components/Fonts";
import { getViewedDocument } from "@/DocumentManager";
import Color from "color";
import { fabric } from "fabric";
import { degrees, PDFFont, PDFPage, PDFPageDrawTextOptions, rgb } from "pdf-lib";

export class TextAnnotation extends Annotation {
    static toolOptions: any;
    static font: PDFFont;
    get textbox(): fabric.Textbox {
        return this.object as fabric.Textbox;
    }
    constructor(page: number, options: fabric.ITextboxOptions, canvas: Canvas) {
        options.originY = 'center', options.originX = 'center';
        super(page, new fabric.Textbox(options.text || 'text', options), canvas, 'Text');
        (this.object as any).tool = TextAnnotation.toolOptions;
        canvas.setActiveObject(this.object);
        this.textbox.selectAll();
        this.object._controlsVisibility = {
            bl: false,
            br: false,
            mtr: true,
            tl: false,
            tr: false,
            mb: false,
            mt: false,
        }
    }
    async bakeObject(page: PDFPage) {
        const font = (this.object as fabric.Textbox).fontFamily || 'Helvetica';
        const doc = getViewedDocument();
        await EmbedFont(doc, font);
        const { width, height } = page.getSize();
        if (this.object == null || this.object.top == null || this.object.left == null || this.textbox.fontSize == null) return;
        const center = new fabric.Point((this.object.width || 0) / 2, -(this.object.height || 0) / 2);
        const pos = new fabric.Point((this.object.left), height - (this.object.top + this.textbox.fontSize)).subtract(center);
        var fontSize: number = this.textbox.fontSize || 14;
        var color = Color(this.object.fill).object();
        console.log(this.object.toSVG());

        var options = <PDFPageDrawTextOptions>{
            x: pos.x,
            y: pos.y,
            size: fontSize,
            font: doc?.embeddedResources[font],
            color: rgb(color.r / 255, color.g / 255, color.b / 255),
            lineHeight: this.textbox._fontSizeMult * fontSize,
        }
        page.drawText(this.textbox.textLines.join('\n'), options);
    }
    serialize(): any {
        return {
            text: this.textbox.textLines.join('\n'),
            top: this.object.top,
            left: this.object.left,
            fontFamily: this.textbox.fontFamily,
            fontSize: this.textbox.fontSize,
            fill: this.textbox.fill,
            width: this.object.width,
            height: this.object.height,
            hasControls: this.object.hasControls,
            editable: this.textbox.editable,
        };
    }
}