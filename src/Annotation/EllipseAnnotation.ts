import { Canvas } from "@/Canvas";
import Color from "color";
import { fabric } from "fabric";
import { PDFPage, rgb, rotateDegrees, translate } from "pdf-lib";
import { Annotation } from "./Annotation";

export class EllipseAnnotation extends Annotation {
    static toolOptions: any;
    constructor(page: number, options: fabric.IEllipseOptions, canvas: Canvas) {
        options.originX = 'center';
        options.originY = 'center';
        options.rx = options.width;
        options.ry = options.height;
        console.log(options);

        super(page, new fabric.Ellipse(options), canvas, 'Ellipse');
        (this.object as any).tool = EllipseAnnotation.toolOptions;
        canvas.setActiveObject(this.object);
    }
    bake(page: PDFPage) {
        const fill = Color((this.object.fill as string).substring(0, 7));
        const stroke = Color((this.object.stroke as string).substring(0, 7));
        const height = page.getHeight();
        let pos = new fabric.Point((this.object.left || 0), height - (this.object.top || 0));
        page.pushOperators(
            translate(pos.x, pos.y),
            rotateDegrees(-(this.object.angle || 0)),
            translate(-pos.x, -pos.y)
        );
        page.drawEllipse({
            borderColor: rgb(stroke.red() / 255, stroke.green() / 255, stroke.blue() / 255),
            color: rgb(fill.blue() / 255, fill.green() / 255, fill.blue() / 255),
            borderWidth: this.object.strokeWidth,
            yScale: (this.object as fabric.Ellipse).ry,
            xScale: (this.object as fabric.Ellipse).rx,
            x: pos.x,
            y: pos.y,
            opacity: parseInt((this.object.fill as string).substring(7, 9), 16) / 255 || 1,
            borderOpacity: parseInt((this.object.stroke as string).substring(7, 9), 16) / 255 || 1,
        });
    }
    serialize(): any {
        return {
            top: this.object.top,
            left: this.object.left,
            fill: this.object.fill,
            stroke: this.object.stroke,
            strokeWidth: this.object.strokeWidth,
            width: (this.object as fabric.Ellipse).rx,
            height: (this.object as fabric.Ellipse).ry,
            angle: this.object.angle,
        };
    }
}