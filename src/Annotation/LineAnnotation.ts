import { Canvas } from "@/Canvas";
import { Annotation } from "./Annotation";
import Color from "color";
import { fabric } from "fabric";
import { PDFPage, rgb, LineCapStyle } from "pdf-lib";

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
        options.lockMovementX = true;
        options.lockMovementY = true;
        if (!options.x1 || !options.x2 || !options.y1 || !options.y2 || !options.strokeWidth) throw new Error('Invalid location')

        super(page, new fabric.Polyline([{ x: options.x1, y: options.y1 }, { x: options.x2, y: options.y2 }], options), canvas, 'Line');
        this.from = new fabric.Point(options.x1, options.y1);
        this.to = new fabric.Point(options.x2, options.y2);
        this.line.set({
            points: this.getArrowPoints(options.x1, options.y1, options.x2, options.y2, options.strokeWidth)
        });
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
            });
            return true;
        }

        function anchorWrapper(tip: boolean, fn: (eventData: MouseEvent, transform: fabric.Transform, x: number, y: number, tip: boolean) => boolean) {
            return function (eventData: MouseEvent, transform: fabric.Transform, x: number, y: number) {
                var fabricObject = transform.target as fabric.Polyline,
                    anchorPoint = tip ? annotation.from : annotation.to,
                    absolutePoint = fabric.util.transformPoint(anchorPoint.subtract(fabricObject.pathOffset), fabricObject.calcTransformMatrix()),
                    actionPerformed = fn(eventData, transform, x, y, tip),
                    baseSize = fabricObject._getNonTransformedDimensions(),
                    // @ts-ignore
                    newDim = fabricObject._setPositionDimensions({}),
                    newPoint = anchorPoint.subtract(fabricObject.pathOffset);
                newPoint.x /= baseSize.x;
                newPoint.y /= baseSize.y;
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
