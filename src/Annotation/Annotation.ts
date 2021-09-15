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
