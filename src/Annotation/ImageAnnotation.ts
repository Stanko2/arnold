import { Canvas } from "@/Canvas";
import { Annotation } from "./Annotation";
import Color from "color";
import { fabric } from "fabric";
import { PDFPage, rgb, rotateDegrees, translate } from "pdf-lib";
import { Database } from "@/Db";

export class ImageAnnotation extends Annotation {
    imageData: string;
    constructor(page: number, options: fabric.Image & { image: string; } | any, canvas: Canvas) {
        options.originX = 'center';
        options.originY = 'center';
        if (options instanceof fabric.Image)
            super(page, options, canvas, 'Image', false);
        else {
            const img = new Image();
            img.src = options.image;
            super(page, new fabric.Image(img, options), canvas, 'Image');
        }
        // (this.object as any).tool = RectAnnotation.toolOptions;
        canvas.setActiveObject(this.object);
        this.imageData = options.image;
    }
    async bake(page: PDFPage) {
        const height = page.getHeight();
        const center = new fabric.Point((this.object.width || 0) / 2, (this.object.height || 0) / 2);
        let pos = new fabric.Point((this.object.left || 0), height - (this.object.top || 0));
        page.pushOperators(
            translate(pos.x, pos.y),
            rotateDegrees(-(this.object.angle || 0)),
            translate(-pos.x, -pos.y)
        );
        pos = pos.subtract(center);
        console.log(this.imageData);
        const img = await page.doc.embedPng(this.imageData);
        page.drawImage(img, {
            height: (this.object.height || 100) * (this.object.scaleY || 1),
            width: (this.object.width || 100) * (this.object.scaleX || 1),
            x: pos.x,
            y: pos.y,
        });
    }
    serialize(): any {
        return {
            top: this.object.top,
            left: this.object.left,
            width: this.object.width,
            height: this.object.height,
            angle: this.object.angle,
            imageData: this.imageData
        };
    }
}
