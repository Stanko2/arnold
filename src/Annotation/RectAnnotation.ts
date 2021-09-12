import { Canvas } from "@/Canvas";
import { Annotation } from "./Annotation";
import Color from "color";
import { fabric } from "fabric";
import { degrees, PDFPage, popGraphicsState, pushGraphicsState, rgb, rotateDegrees, translate } from "pdf-lib";

export class RectAnnotation extends Annotation {
    static toolOptions: any;
    constructor(page: number, options: fabric.IRectOptions, canvas: Canvas) {
        options.originX = 'center';
        options.originY = 'center';
        super(page, new fabric.Rect(options), canvas, 'Rect');
        (this.object as any).tool = RectAnnotation.toolOptions;
        canvas.setActiveObject(this.object);
    }
    bakeObject(page: PDFPage) {
        var fill: Color = Color(this.object.fill);
        var stroke: Color = Color(this.object.stroke);
        const height = page.getHeight();
        const center = new fabric.Point((this.object.width || 0) / 2, (this.object.height || 0) / 2);
        let pos = new fabric.Point((this.object.left || 0), height - (this.object.top || 0)).subtract(center);
        page.drawRectangle({
            borderColor: rgb(stroke.red() / 255, stroke.green() / 255, stroke.blue() / 255),
            color: rgb(fill.blue() / 255, fill.green() / 255, fill.blue() / 255),
            borderWidth: this.object.strokeWidth,
            height: this.object.height,
            width: this.object.width,
            x: pos.x,
            y: pos.y,
        });
    }
    serialize(): any {
        return {
            top: this.object.top,
            left: this.object.left,
            fill: this.object.fill,
            stroke: this.object.stroke,
            strokeWidth: this.object.strokeWidth,
            width: this.object.width,
            height: this.object.height,
            angle: this.object.angle,
        };
    }
}
