import { Canvas } from "@/Canvas";
import { fabric } from "fabric";
import { PDFPage, popGraphicsState, pushGraphicsState, rotateDegrees, translate } from "pdf-lib";

export abstract class Annotation {
    constructor(public page: number, public object: fabric.Object, public canvas: Canvas, private type: string, create: boolean = true) {
        if (create)
            canvas.add(this.object);
        if (!this.object.name)
            this.object.name = `${this.type}_${Math.random().toString(36).substr(2, 9)}`
    }

    public abstract bakeObject(page: PDFPage): void;

    public bake(page: PDFPage) {
        if (this.object.originY === 'center' && this.object.originX === 'center') {
            const height = page.getHeight();
            const pos = new fabric.Point((this.object.left || 0), height - (this.object.top || 0));
            console.log(pos);
            page.pushOperators(
                pushGraphicsState(),
                translate(pos.x, pos.y),
                rotateDegrees(-(this.object.angle || 0)),
                translate(-pos.x, -pos.y)
            );
            this.bakeObject(page);
            page.pushOperators(popGraphicsState());
        }
        else this.bakeObject(page);
    }

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
