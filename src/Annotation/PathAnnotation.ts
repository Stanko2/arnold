import { Canvas } from "@/Canvas";
import {Annotation} from "./Annotation";
import Color from "color";
import { fabric } from "fabric";
import { PDFPage, LineCapStyle, rgb } from "pdf-lib";

export class PathAnnotation extends Annotation {
    public bake(page: PDFPage): void {
        const parser = new DOMParser();
        const a = parser.parseFromString(this.object.toSVG(), "image/svg+xml");
        const translationMatrix = a.firstElementChild?.getAttribute('transform')?.match(/-?[0-9]+(\.[0-9]*)?/gm)?.map(e => parseFloat(e));
        const objTranslation = a.querySelector('path')?.getAttribute('transform')?.match(/-?[0-9]+(\.[0-9]*)?/gm)?.map(e => parseFloat(e));
        if (objTranslation == null || translationMatrix == null) return;
        const objMatrix: number[] = [1, 0, 1, 0, objTranslation[0], objTranslation[1]]
        const finalMatrix = fabric.util.multiplyTransformMatrices(translationMatrix, objMatrix);
        const position = fabric.util.transformPoint(new fabric.Point(0, 0), finalMatrix, false);
        const path = a.querySelector('path')?.getAttribute('d') || '';
        var color = Color(this.object.stroke).object();
        page.drawSvgPath(path, {
            borderWidth: this.object.strokeWidth,
            x: position.x,
            y: page.getHeight() - position.y,
            borderLineCap: LineCapStyle.Round,
            borderDashPhase: 1,
            borderColor: rgb(color.r / 255, color.g / 255, color.b / 255)
        });
    }
    protected serialize() {
        const parser = new DOMParser();
        const a = parser.parseFromString(this.object.toSVG(), "image/svg+xml");
        const path = a.querySelector('path')?.getAttribute('d') || '';
        return {
            path: path,
            options: <Partial<fabric.IPathOptions>>{
                stroke: this.object.stroke,
                strokeWidth: this.object.strokeWidth,
                fill: this.object.fill,
                borderColor: this.object.borderColor,
                backgroundColor: this.object.backgroundColor,
                strokeDashArray: this.object.strokeDashArray,
                strokeLineCap: this.object.strokeLineCap,
                strokeDashOffset: this.object.strokeDashOffset,
                strokeLineJoin: this.object.strokeLineJoin,
                top: this.object.top,
                left: this.object.left,
            }
        }
    }
    constructor(page: number, object: fabric.Path | { path: string, options: fabric.IPathOptions }, canvas: Canvas) {
        if (object instanceof fabric.Path) {
            object.hasControls = false;
            super(page, object, canvas, 'Path', false);
        }
        else {
            const options = object.options;
            options.hasControls = false;
            super(page, new fabric.Path(object.path, options), canvas, 'Path');
        }
    }


}