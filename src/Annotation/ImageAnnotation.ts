import { Canvas } from "@/Canvas";
import { Annotation } from "./Annotation";
import Color from "color";
import { fabric } from "fabric";
import { PDFPage, popGraphicsState, pushGraphicsState, rgb, rotateDegrees, translate } from "pdf-lib";
import { Database } from "@/Db";

export class ImageAnnotation extends Annotation {
    imageData: string;
    constructor(page: number, options: fabric.IImageOptions & { image: string; }, canvas: Canvas) {
        options.originX = 'center';
        options.originY = 'center';
        const img = new Image();
        img.src = options.image;
        img.onerror = (msg, url, lineNo, columnNo, error) => {
            console.log(msg);
        }
        img.onload = () => {
            this.object.set({width: img.width, height: img.height});
            this.object.canvas?.requestRenderAll();
        }
        super(page, new fabric.Image(img, options), canvas, 'Image');
        canvas.setActiveObject(this.object);
        this.imageData = options.image;
    }
    async bake(page: PDFPage) {
        if (!this.object.width || !this.object.height || !this.object.scaleX || !this.object.scaleY) return;
        const pageHeight = page.getHeight();
        const height = this.object.height * this.object.scaleY
        const width = this.object.width * this.object.scaleX
        const center = new fabric.Point(width / 2, height / 2);
        let pos = new fabric.Point((this.object.left || 0), pageHeight - (this.object.top || 0));
        page.pushOperators(
            pushGraphicsState(),
            // translate(pos.x, -pos.y),
            // rotateDegrees(-(this.object.angle || 0)),
            // translate(-pos.x, pos.y)
        );
        pos = pos.subtract(center);
        const img = await page.doc.embedPng(this.imageData);
        console.log((this.object.height || 100) * (this.object.scaleY || 1));

        page.drawImage(img, {
            height: height,
            width: width,
            x: pos.x,
            y: pos.y
        });
        page.pushOperators(popGraphicsState())
    }
    serialize(): any {
        return {
            top: this.object.top,
            left: this.object.left,
            width: this.object.width,
            height: this.object.height,
            scaleX: this.object.scaleX,
            scaleY: this.object.scaleY,
            angle: this.object.angle,
            image: this.imageData
        };
    }
}
