import { Canvas } from "@/Canvas";
import { Annotation } from "./Annotation";
import Color from "color";
import { fabric } from "fabric";
import { PDFPage, LineCapStyle, rgb, concatTransformationMatrix, pushGraphicsState, scale, translate, popGraphicsState, rotateDegrees } from "pdf-lib";

export class PathAnnotation extends Annotation {
    public bakeObject(page: PDFPage): void {
        /*
                <g transform="matrix(0.89 0.46 -0.46 0.89 225.08 585.02)"  >
        <path style="stroke: rgb(0,0,0); stroke-width: 10; stroke-dasharray: none; stroke-linecap: round; stroke-dashoffset: 0; stroke-linejoin: round; stroke-miterlimit: 4; fill: none; fill-rule: nonzero; opacity: 1;"  transform=" translate(-233.78, -183.69)" d="M 73.27734375 20255 73.27734375" /></g>
        */
        const height = page.getHeight();
        const parser = new DOMParser();
        const a = parser.parseFromString(this.object.toSVG(), "image/svg+xml");
        const translationMatrix = a.firstElementChild?.getAttribute('transform')?.match(/-?[0-9]+(\.[0-9]*)?/gm)?.map(e => parseFloat(e));
        const objTranslation = a.querySelector('path')?.getAttribute('transform')?.match(/-?[0-9]+(\.[0-9]*)?/gm)?.map(e => parseFloat(e));
        if (objTranslation == null || translationMatrix == null) return;
        const objMatrix: number[] = [1, 0, 1, 0, objTranslation[0], objTranslation[1]]
        const transform = fabric.util.multiplyTransformMatrices(translationMatrix, objMatrix);
        const path = a.querySelector('path')?.getAttribute('d') || '';
        const baseposition = fabric.util.transformPoint(new fabric.Point(0, 0), transform, false);

        const color = Color((this.object.stroke as string).substring(0, 7)).object();
        const center = new fabric.Point((this.object.left || 0), height - (this.object.top || 0));
        const position = baseposition;// fabric.util.rotatePoint(baseposition, center, fabric.util.degreesToRadians(-(this.object.angle || 0)));
        page.pushOperators(
            translate(center.x, center.y),
            rotateDegrees(-(this.object.angle || 0)),
            translate(-center.x, -center.y),
        );
        position.y = height - position.y;
        // const offset = position.subtract(center);
        // const angle = Math.atan2(offset.y, offset.x) - fabric.util.degreesToRadians(this.object.angle || 0);
        // const len = Math.sqrt(offset.x * offset.x + offset.y * offset.y);

        // page.drawCircle({
        //     x: center.x,
        //     y: center.y,
        //     color: rgb(1, 0, 0),
        //     size: 30
        // })
        // page.drawCircle({
        //     x: center.x + len * Math.cos(angle),
        //     y: center.y + len * Math.sin(angle),
        //     color: rgb(0, 1, 0),
        //     size: 30
        // })
        page.drawSvgPath(path, {
            borderWidth: this.object.strokeWidth,
            // x: center.x - len * Math.cos(angle),
            // y: center.y - len * Math.sin(angle),
            x: position.x,
            y: position.y,
            borderLineCap: LineCapStyle.Round,
            borderDashPhase: 1,
            borderOpacity: parseInt((this.object.stroke as string).substring(7, 9), 16) / 255 || 1,
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
            options.originY = 'center';
            options.originX = 'center';
            super(page, new fabric.Path(object.path, options), canvas, 'Path');
            this.object._controlsVisibility = { mtr: true };
        }
    }


}