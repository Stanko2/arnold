import { Canvas } from "@/Canvas";
import { fabric } from "fabric";
import { PDFPage } from "pdf-lib";

export abstract class Annotation {
    constructor(public page: number, public object: fabric.Object, public canvas: Canvas, private type: string, create: boolean = true) {
        const style = getComputedStyle(document.documentElement);
        const primary = style.getPropertyValue('--primary');
        const scale = 5;
        this.object.cornerStyle = 'circle';
        this.object.cornerColor = primary;
        this.object.cornerStrokeColor = primary;
        this.object.cornerSize = 10;
        this.object.borderColor = primary;
        this.object.borderScaleFactor = scale;
        this.object.transparentCorners = false;
        this.object.paintFirst = 'fill';
        this.object.controls['ml'].offsetX = -scale / 2;
        this.object.controls['mr'].offsetX = scale / 2;
        this.object.controls['mt'].offsetY = -scale / 2;
        this.object.controls['mb'].offsetY = scale / 2;
        this.object.controls['tl'].offsetX = -scale / 2;
        this.object.controls['tr'].offsetX = scale / 2;
        this.object.controls['tl'].offsetY = -scale / 2;
        this.object.controls['tr'].offsetY = -scale / 2;
        this.object.controls['bl'].offsetY = scale / 2;
        this.object.controls['br'].offsetY = scale / 2;
        this.object.controls['bl'].offsetX = -scale / 2;
        this.object.controls['br'].offsetX = scale / 2;

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
