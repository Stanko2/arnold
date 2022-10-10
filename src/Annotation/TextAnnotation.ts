import { Canvas } from "@/Canvas";
import { Annotation } from "./Annotation";
import { EmbedFont } from "@/components/Fonts";
import { getViewedDocument } from "@/Documents/DocumentManager";
import Color from "color";
import { fabric } from "fabric";
import { concatTransformationMatrix, degrees, PDFFont, PDFPage, PDFPageDrawTextOptions, popGraphicsState, pushGraphicsState, rgb, rotateDegrees, scale, toHexStringOfMinLength, translate } from "pdf-lib";

export interface TextStyle {

}

export class TextAnnotation extends Annotation {
    static toolOptions: any;
    static font: PDFFont;
    get textbox(): fabric.Textbox {
        return this.object as fabric.Textbox;
    }
    constructor(page: number, options: fabric.ITextboxOptions, canvas: Canvas) {
        // options.fontWeight = 'bold';
        options.originX = 'left';
        options.originY = 'center';
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
    async bake(page: PDFPage) {
        /*
         <g transform="matrix(1 0 0 1 200.67 340.73)" style=""  >
            <text xml:space="preserve" font-family="Helvetica" font-size="155" font-style="normal" font-weight="normal" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(28,160,133); fill-rule: nonzero; opacity: 1; white-space: pre;" ><tspan x="-146.52" y="-52.9" >text</tspan><tspan x="-146.52" y="150.28" >ahoj</tspan></text>
        </g> 
         */
        const font = (this.object as fabric.Textbox).fontFamily || 'Open Sans';
        const doc = getViewedDocument();
        await EmbedFont(doc, font);

        const height = page.getHeight();
        if (this.object == null || this.object.top == null || this.object.left == null || this.textbox.fontSize == null) return;
        const fontSize: number = this.textbox.fontSize || 14;
        const color = Color((this.object.fill as string).substring(0, 7)).object();
        const parser = new DOMParser(),
            data = parser.parseFromString(this.object.toSVG(), "image/svg+xml"),
            transform = data.querySelector('g')?.getAttribute('transform')?.match(/-?[0-9]+(\.[0-9]*)?/gm)?.map(e => parseFloat(e)) || [1, 0, 0, 0, 1, 0];

        page.pushOperators(
            pushGraphicsState(),
            translate(0, height),
            scale(1, -1),
            concatTransformationMatrix(transform[0], transform[1], transform[2], transform[3], transform[4], transform[5])
        );
        data.querySelectorAll('tspan').forEach((tspan: { getAttribute: (arg0: string) => any; innerHTML: string; }) => {
            const translation = new fabric.Point(parseFloat(tspan.getAttribute('x') || '0'), parseFloat(tspan.getAttribute('y') || '0'));
            page.pushOperators(
                pushGraphicsState(),
                translate(translation.x, translation.y),
                scale(1, -1)
            );
            const options = <PDFPageDrawTextOptions>{
                x: 0,
                y: 0,
                size: fontSize,
                font: doc?.embeddedResources[font],
                color: rgb(color.r / 255, color.g / 255, color.b / 255),
                lineHeight: this.textbox._fontSizeMult * fontSize,
                opacity: parseInt((this.object.fill as string).substring(7, 9), 16) / 255 || 1,
            }
            page.drawText(tspan.innerHTML, options);
            page.pushOperators(popGraphicsState());
        });
        page.pushOperators(popGraphicsState());
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
            angle: this.textbox.angle,
        };
    }
}