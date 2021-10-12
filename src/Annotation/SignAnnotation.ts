import { Canvas } from "@/Canvas";
import { Annotation } from "./Annotation";
import Color from "color";
import { fabric } from "fabric";
import { PDFPage, LineCapStyle, rgb } from "pdf-lib";

export class SignAnnotation extends Annotation {
    public bake(page: PDFPage): void {
        const grp = this.object as fabric.Group;
        if (!grp.left || !grp.top || !grp.height || !grp.width) {
            throw new Error(`Invalid object location`);
        }
        const parser = new DOMParser();
        const a = parser.parseFromString(grp.toSVG(), "image/svg+xml");
        const translationMatrix = a.firstElementChild?.getAttribute('transform')?.match(/-?[0-9]+(\.[0-9]*)?/gm)?.map(e => parseFloat(e));
        const color = Color((this.object.stroke as string).substring(0, 7)).object();
        if (translationMatrix == null) return;

        a.querySelectorAll('path').forEach(p => {
            const parentTransform = p.parentElement?.getAttribute('transform')?.match(/-?[0-9]+(\.[0-9]*)?/gm)?.map(e => parseFloat(e));
            const objTranslation = p.getAttribute('transform')?.match(/-?[0-9]+(\.[0-9]*)?/gm)?.map(e => parseFloat(e));
            if (objTranslation == null || parentTransform == null) return;
            const objMatrix: number[] = [1, 0, 1, 0, objTranslation[0], objTranslation[1]]
            const finalMatrix = fabric.util.multiplyTransformMatrices(fabric.util.multiplyTransformMatrices(translationMatrix, parentTransform), objMatrix);
            const position = fabric.util.transformPoint(new fabric.Point(0, 0), finalMatrix, false);
            const path = p.getAttribute('d');
            if (!path) return;
            page.drawSvgPath(path, {
                borderWidth: (grp.strokeWidth || 10),
                x: position.x,
                y: page.getHeight() - position.y,
                scale: finalMatrix[0],
                borderLineCap: LineCapStyle.Round,
                borderDashPhase: 1,
                borderColor: rgb(color.r / 255, color.g / 255, color.b / 255),
                borderOpacity: parseInt((this.object.stroke as string).substring(7, 9), 16) / 255 || 1,
            });
        });
    }
    protected serialize() {
        const grp = this.object as fabric.Group;

        return {
            stroke: grp._objects[0].stroke,
            strokeWidth: grp._objects[0].strokeWidth,
            fill: grp._objects[0].fill,
            borderColor: grp._objects[0].borderColor,
            backgroundColor: grp._objects[0].backgroundColor,
            strokeDashArray: grp._objects[0].strokeDashArray,
            strokeLineCap: grp._objects[0].strokeLineCap,
            strokeDashOffset: grp._objects[0].strokeDashOffset,
            strokeLineJoin: grp._objects[0].strokeLineJoin,
            top: grp.top,
            left: grp.left,
            scaleX: grp.scaleX,
            scaleY: grp.scaleY,
            paths: grp.getObjects().map(e => {
                const parser = new DOMParser();
                const a = parser.parseFromString(e.toSVG(), "image/svg+xml");
                const path = a.querySelector('path')?.getAttribute('d') || '';
                return {
                    path: path,
                    top: e.top,
                    left: e.left
                }
            })
        };
    }

    constructor(page: number, object: fabric.Group | any, canvas: Canvas) {
        if (object instanceof fabric.Group) {
            super(page, object, canvas, 'Sign', false);

        }
        else {
            const paths: fabric.Path[] = [];
            const options = Object.assign({}, object);
            delete options.paths;
            options.scaleX = 1, options.scaleY = 1;
            options.originX = 'center', options.originY = 'center';
            const position = new fabric.Point(object.left, object.top);
            delete object.top, object.left;
            for (const path of object.paths) {
                options.left = path.left;
                options.top = path.top;
                const p = new fabric.Path(path.path, options)
                paths.push(p);
                // canvas.add(p);
            }

            super(page, new fabric.Group(paths, object, false), canvas, 'Sign');
            (this.object as fabric.Group).getObjects().forEach((o, i) => {
                o.set({
                    left: object.paths[i].left,
                    top: object.paths[i].top,
                })
            });
            this.object.set({
                left: position.x,
                top: position.y,
                originX: 'left',
                originY: 'top'
            })
        }
        console.log(this.object.toJSON());
    }
}
