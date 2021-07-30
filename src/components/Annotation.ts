import { Canvas } from '@/Canvas';
import { fabric } from 'fabric';
import Color from 'color';
import { LineCapStyle, PDFFont, PDFPage, PDFPageDrawTextOptions, rgb } from 'pdf-lib';
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

    convertSvgData(svg: string): string {
        const commands: string[] = [];
        const data = svg.split(' ');
        let index = 0;
        while (index < data.length) {
            switch (data[index]) {
                case 'M':
                    commands.push(data[index]);
                    commands.push(`${this.floorString(data[index + 1])},${this.floorString(data[index + 2])}`);
                    index += 3;
                    break;
                case 'Q':
                    commands.push(data[index]);
                    commands.push(`${this.floorString(data[index + 1])},${this.floorString(data[index + 2])}`);
                    index += 3;
                    commands.push(`${this.floorString(data[index])},${this.floorString(data[index + 1])}`);
                    index += 2;
                    break;
                case 'L':
                    commands.push(data[index]);
                    commands.push(`${this.floorString(data[index + 1])},${this.floorString(data[index + 2])}`);
                    index += 3;
                    break;
            }
        }
        return commands.join(" ");
    }

    floorString(str: string): number {
        return Math.floor(parseInt(str));
    }

}

export class PathAnnotation extends Annotation {
    public bake(page: PDFPage): void {
        const path = this.convertSvgData(this.object.toClipPathSVG().split('d=')[1].split('"')[1]);
        var color = Color(this.object.stroke).object();
        page.drawSvgPath(path, {
            borderWidth: this.object.strokeWidth,
            x: 0,
            y: page.getHeight(),
            borderLineCap: LineCapStyle.Round,
            borderDashPhase: 1,
            borderColor: rgb(color.r / 255, color.g / 255, color.b / 255)
        });
    }
    protected serialize() {
        const path = this.convertSvgData(this.object.toClipPathSVG().split('d=')[1].split('"')[1]);
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
            object.hasControls = false;
            object.lockMovementX = true;
            object.lockMovementY = true;
            super(page, object, canvas, 'Path', false);
        }
        else {
            const options = object.options;
            options.hasControls = false;
            options.lockMovementY = true;
            options.lockMovementX = true;
            super(page, new fabric.Path(object.path, options), canvas, 'Path');
        }
    }


}

export class SignAnnotation extends Annotation {
    public bake(page: PDFPage): void {
        const grp = this.object as fabric.Group;
        const color = Color(this.object.stroke).object();
        if (!grp.left || !grp.top || !grp.height || !grp.width) {
            throw new Error(`Invalid object location`);
        }
        const parser = new DOMParser();
        const a = parser.parseFromString(grp.toSVG(), "image/svg+xml");
        const translationMatrix = a.firstElementChild?.getAttribute('transform')?.match(/-?[0-9]+(\.[0-9]*)?/gm)?.map(e => parseFloat(e));
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
                return {
                    path: this.convertSvgData(e.toClipPathSVG().split('d=')[1].split('"')[1]),
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
    // start: fabric.Circle;
    // end: fabric.Circle;
    get line(): fabric.Line {
        return this.object as fabric.Line;
    }
    constructor(page: number, options: fabric.ILineOptions, canvas: Canvas) {
        options.hasControls = true;
        options.hasBorders = false;
        options.strokeLineCap = 'round';
        if (!options.x1 || !options.x2 || !options.y1 || !options.y2) throw new Error('Invalid location')

        super(page, new fabric.Line([options.x1, options.y1, options.x2, options.y2], options), canvas, 'Line');
        (this.object as fabric.Line).set({ x1: options.x1, y1: options.y1, x2: options.x2, y2: options.y2 });
        (this.object as any).tool = LineAnnotation.toolOptions;
        this.object._controlsVisibility = {
            bl: false,
            br: true,
            mb: false,
            ml: false,
            mr: false,
            mt: false,
            mtr: false,
            tl: true,
            tr: false,
        }
        this.object.controls.tl = new fabric.Control({
            visible: true,
            actionHandler: (e, transform, x, y) => {
                const line = transform.target as fabric.Line;
                line.set({
                    x1: x, y1: y,
                })

                if (!line.x1 || !line.x2 || !line.y1 || !line.y2) return true;
                line.controls.tl.y = Math.min(line.y1, line.y2) == line.y2 ? 0.5 : -0.5;
                line.controls.tl.x = Math.min(line.x1, line.x2) == line.x2 ? 0.5 : -0.5;
                line.controls.br.y = Math.min(line.y1, line.y2) == line.y1 ? 0.5 : -0.5;
                line.controls.br.x = Math.min(line.x1, line.x2) == line.x1 ? 0.5 : -0.5;
                return true;
            },
            actionName: 'firstMove',
            cursorStyle: 'pointer',
            x: -0.5,
            y: -0.5
        })
        this.object.controls.br = new fabric.Control({
            visible: true,
            actionHandler: (e, transform, x, y) => {
                const line = transform.target as fabric.Line;
                line.set({
                    x2: x, y2: y,
                })
                if (!line.x1 || !line.x2 || !line.y1 || !line.y2) return true;
                line.controls.br.y = Math.min(line.y1, line.y2) == line.y1 ? 0.5 : -0.5;
                line.controls.br.x = Math.min(line.x1, line.x2) == line.x1 ? 0.5 : -0.5;
                line.controls.tl.y = Math.min(line.y1, line.y2) == line.y2 ? 0.5 : -0.5;
                line.controls.tl.x = Math.min(line.x1, line.x2) == line.x2 ? 0.5 : -0.5;
                return true;
            },
            actionName: 'secondMove',
            cursorStyle: 'pointer',
            x: 0.5,
            y: 0.5,

        })
        this.options = options;
        canvas.setActiveObject(this.object);
    }
    updatePoints() {
    }
    options: any;
    delete() {
        super.delete();
    }
    bake(page: PDFPage) {
        var stroke: Color = Color(this.object.stroke);
        const { width, height } = page.getSize();
        var line = this.object as fabric.Line;
        page.drawLine({
            start: {
                x: line.x1 || 0,
                y: height - (line.y1 || 0)
            },
            end: {
                x: line.x2 || 0,
                y: height - (line.y2 || 0)
            },
            color: rgb(stroke.red() / 255, stroke.green() / 255, stroke.blue() / 255),
            thickness: this.object.strokeWidth,
            lineCap: LineCapStyle.Round
        });
    }

    serialize(): any {
        return {
            x1: this.line.x1,
            y1: this.line.y1,
            x2: this.line.x2,
            y2: this.line.y2,
            stroke: this.object.stroke,
            strokeWidth: this.object.strokeWidth,
        };
    }
}
