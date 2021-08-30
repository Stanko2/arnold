import { Canvas } from '@/Canvas';
import { fabric } from 'fabric';
import Color from 'color';
import { defaultOptionListAppearanceProvider, LineCapStyle, PDFFont, PDFPage, PDFPageDrawTextOptions, rgb } from 'pdf-lib';
import { getViewedDocument } from '@/DocumentManager';
import { EmbedFont } from './Fonts';

export abstract class Annotation {
    constructor(public page: number, public object: fabric.Object, public canvas: Canvas, private type: string, create: boolean = true) {
        if (create)
            canvas.add(this.object);
        if (!this.object.name)
            this.object.name = `${this.type}_${Math.random().toString(36).substr(2, 9)}`
    }

    public abstract bake(page: PDFPage): void;

    public serializeToJSON(): any {
        return {
            page: this.page,
            type: this.type,
            data: {
                ...this.serialize(),
                name: this.object.name
            }
        }
    }

    public delete(): void {
        this.canvas.remove(this.object);
        this.canvas.renderAll();
    }

    protected abstract serialize(): any;
}

abstract class SvgAnnotation extends Annotation {
    public bake(page: PDFPage): void {

    }
    protected abstract serialize(): any;

}

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

            }
        }
    }
    constructor(page: number, object: fabric.Path | { path: string, options: fabric.IPathOptions }, canvas: Canvas) {
        if (object instanceof fabric.Path) {
            super(page, object, canvas, 'Path', false);
        }
        else {
            const options = object.options;
            super(page, new fabric.Path(object.path, options), canvas, 'Path');
        }
    }


}

export class SignAnnotation extends Annotation {
    public bake(page: PDFPage): void {
        const grp = this.object as fabric.Group;
        if (!grp.left || !grp.top || !grp.height || !grp.width) {
            throw new Error(`Invalid object location`);
        }
        const parser = new DOMParser();
        const a = parser.parseFromString(grp.toSVG(), "image/svg+xml");
        const translationMatrix = a.firstElementChild?.getAttribute('transform')?.match(/-?[0-9]+(\.[0-9]*)?/gm)?.map(e => parseFloat(e));
        const color = Color(this.object.stroke).object();
        console.log(a);
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
            this.object.set({
                left: position.x,
                top: position.y,
                originX: 'left',
                originY: 'top'
            })
        }
    }
}

export class TextAnnotation extends Annotation {
    static toolOptions: any;
    static font: PDFFont;
    get textbox(): fabric.Textbox {
        return this.object as fabric.Textbox;
    }
    constructor(page: number, options: fabric.ITextboxOptions, canvas: Canvas) {
        super(page, new fabric.Textbox(options.text || 'text', options), canvas, 'Text');
        (this.object as any).tool = TextAnnotation.toolOptions;
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
    async bake(page: PDFPage) {
        const font = (this.object as fabric.Textbox).fontFamily || 'Helvetica';
        const doc = getViewedDocument();
        await EmbedFont(doc, font);
        const { width, height } = page.getSize();
        if (this.object == null || this.object.top == null || this.object.left == null || this.textbox.fontSize == null) return;
        var x = this.object.left || 0;
        var y = height - (this.object.top + this.textbox.fontSize);
        var fontSize: number = this.textbox.fontSize || 14;
        var color = Color(this.object.fill).object();
        var options = <PDFPageDrawTextOptions>{
            x: x,
            y: y,
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

export class RectAnnotation extends Annotation {
    static toolOptions: any;
    constructor(page: number, options: fabric.IRectOptions, canvas: Canvas) {
        super(page, new fabric.Rect(options), canvas, 'Rect');
        (this.object as any).tool = RectAnnotation.toolOptions;
        canvas.setActiveObject(this.object);
    }
    bake(page: PDFPage) {
        var fill: Color = Color(this.object.fill);
        var stroke: Color = Color(this.object.stroke);
        const { width, height } = page.getSize();
        page.drawRectangle({
            borderColor: rgb(stroke.red() / 255, stroke.green() / 255, stroke.blue() / 255),
            color: rgb(fill.blue() / 255, fill.green() / 255, fill.blue() / 255),
            borderWidth: this.object.strokeWidth,
            height: this.object.height,
            width: this.object.width,
            x: this.object.left,
            y: height - (this.object.top || 0) - (this.object.height || 0),
        })
    }
    serialize(): any {
        return {
            top: this.object.top,
            left: this.object.left,
            fill: this.object.fill,
            stroke: this.object.stroke,
            strokeWidth: this.object.strokeWidth,
            width: this.object.width,
            height: this.object.height
        };
    }
}

export class LineAnnotation extends Annotation {
    static toolOptions: any;
    from: fabric.Point;
    to: fabric.Point;
    get line(): fabric.Polyline {
        return this.object as fabric.Polyline;
    }
    constructor(page: number, options: fabric.ILineOptions, canvas: Canvas) {
        options.hasControls = true;
        options.hasBorders = false;
        options.strokeLineCap = 'round';
        options.cornerSize = 20;
        options.cornerStyle = "circle";
        options.cornerColor = 'blue';
        options.originX = 'left';
        options.originY = 'top';
        if (!options.x1 || !options.x2 || !options.y1 || !options.y2 || !options.strokeWidth) throw new Error('Invalid location')

        super(page, new fabric.Polyline([{ x: options.x1, y: options.y1 }, { x: options.x2, y: options.y2 }], options), canvas, 'Line');
        this.from = new fabric.Point(options.x1, options.y1);
        this.to = new fabric.Point(options.x2, options.y2);
        this.line.set({
            points: this.getArrowPoints(options.x1, options.y1, options.x2, options.y2, options.strokeWidth)
        });
        console.log(this.line.points);
        const annotation = this;
        function actionHandler(eventData: MouseEvent, transform: fabric.Transform, x: number, y: number, tip: boolean) {
            let polygon = transform.target as fabric.Polyline,
                mouseLocalPosition = polygon.toLocalPoint(new fabric.Point(x, y), 'center', 'center'),
                polygonBaseSize = polygon._getNonTransformedDimensions(),
                size = polygon._getTransformedDimensions(0, 0),
                finalPointPosition = {
                    x: mouseLocalPosition.x * polygonBaseSize.x / size.x + polygon.pathOffset.x,
                    y: mouseLocalPosition.y * polygonBaseSize.y / size.y + polygon.pathOffset.y
                };
            let points;
            if (tip) {
                points = annotation.getArrowPoints(annotation.from.x, annotation.from.y, finalPointPosition.x, finalPointPosition.y, polygon.strokeWidth || 1);
            }
            else {
                points = annotation.getArrowPoints(finalPointPosition.x, finalPointPosition.y, annotation.to.x, annotation.to.y, polygon.strokeWidth || 1)
            }
            polygon.set({
                points: points,
                // top: Math.min(...points.map(e => e.y)),
                // left: Math.min(...points.map(e => e.x))
            });
            return true;
        }

        function anchorWrapper(tip: boolean, fn: (eventData: MouseEvent, transform: fabric.Transform, x: number, y: number, tip: boolean) => boolean) {
            return function (eventData: MouseEvent, transform: fabric.Transform, x: number, y: number) {
                var fabricObject = transform.target as fabric.Polyline,
                    point = tip ? annotation.to : annotation.from,
                    absolutePoint = fabric.util.transformPoint(point.subtract(fabricObject.pathOffset), fabricObject.calcTransformMatrix()),
                    actionPerformed = fn(eventData, transform, x, y, tip),
                    baseSize = fabricObject._getNonTransformedDimensions(),
                    // @ts-ignore
                    newDim = fabricObject._setPositionDimensions({}),
                    newPoint = point.subtract(fabricObject.pathOffset);
                newPoint.x /= baseSize.x;
                newPoint.y /= baseSize.y;
                // @ts-ignore
                fabricObject.setPositionByOrigin(absolutePoint, newPoint.x + 0.5, newPoint.y + 0.5);
                return actionPerformed;
            }
        }

        (this.object as any).tool = LineAnnotation.toolOptions;
        this.object.controls = {
            from: new fabric.Control({
                positionHandler: (dim, finalMatrix, fabricObject, control) => polygonPositionHandler(dim, finalMatrix, fabricObject as fabric.Polyline, this.from),
                actionHandler: anchorWrapper(false, actionHandler),
                actionName: 'move_from'
            }),
            to: new fabric.Control({
                positionHandler: (dim, finalMatrix, fabricObject, control) => polygonPositionHandler(dim, finalMatrix, fabricObject as fabric.Polyline, this.to),
                actionHandler: anchorWrapper(true, actionHandler),
                actionName: 'move_to'
            })
        }

        this.options = options;
        canvas.setActiveObject(this.object);
    }
    options: any;
    delete() {
        super.delete();
    }
    bake(page: PDFPage) {



        const height = page.getHeight(),
            parser = new DOMParser(),
            svg = parser.parseFromString(this.object.toSVG(), "image/svg+xml"),
            transform = svg.querySelector('g')?.getAttribute('transform')?.match(/-?[0-9]+(\.[0-9]*)?/gm)?.map(e => parseFloat(e)),
            position = fabric.util.transformPoint(new fabric.Point(0, 0), transform || [1, 0, 0, 1, 0, 0]),
            path = 'M' + svg.querySelector('polyline')?.getAttribute('points'),
            stroke = Color(this.object.stroke).object();


        page.drawSvgPath(path, {
            borderColor: rgb(stroke.r / 255, stroke.g / 255, stroke.b / 255),

            x: position.x,
            y: height - position.y,
            borderWidth: this.object.strokeWidth,
            borderLineCap: LineCapStyle.Round
        });
    }
    getArrowPoints(fromx: number, fromy: number, tox: number, toy: number, width: number): fabric.Point[] {
        this.from = new fabric.Point(fromx, fromy);
        this.to = new fabric.Point(tox, toy);
        var angle = Math.atan2(toy - fromy, tox - fromx);

        var headlen = width;  // arrow head size

        // bring the line end back some to account for arrow head.
        tox = tox - (headlen) * Math.cos(angle);
        toy = toy - (headlen) * Math.sin(angle);

        // calculate the points.
        return [
            new fabric.Point(fromx, fromy),
            new fabric.Point(fromx - (headlen / 4) * Math.cos(angle - Math.PI / 2), fromy - (headlen / 4) * Math.sin(angle - Math.PI / 2)),
            new fabric.Point(tox - (headlen / 4) * Math.cos(angle - Math.PI / 2), toy - (headlen / 4) * Math.sin(angle - Math.PI / 2)),
            new fabric.Point(tox - (headlen) * Math.cos(angle - Math.PI / 2), toy - (headlen) * Math.sin(angle - Math.PI / 2)),
            new fabric.Point(tox + (headlen) * Math.cos(angle), toy + (headlen) * Math.sin(angle)),
            new fabric.Point(tox - (headlen) * Math.cos(angle + Math.PI / 2), toy - (headlen) * Math.sin(angle + Math.PI / 2)),
            new fabric.Point(tox - (headlen / 4) * Math.cos(angle + Math.PI / 2), toy - (headlen / 4) * Math.sin(angle + Math.PI / 2)),
            new fabric.Point(fromx - (headlen / 4) * Math.cos(angle + Math.PI / 2), fromy - (headlen / 4) * Math.sin(angle + Math.PI / 2)),
            new fabric.Point(fromx, fromy),
        ];
    }
    serialize(): any {
        return {
            x1: this.from.x,
            y1: this.from.y,
            x2: this.to.x,
            y2: this.to.y,
            stroke: this.object.stroke,
            strokeWidth: this.object.strokeWidth,
        };
    }
}


function polygonPositionHandler(dim: any, finalMatrix: any, fabricObject: fabric.Polyline, point: fabric.Point) {
    return fabric.util.transformPoint(
        point.subtract(fabricObject.pathOffset),
        fabric.util.multiplyTransformMatrices(
            fabricObject.canvas?.viewportTransform || [],
            fabricObject.calcTransformMatrix()
        )
    );
}
