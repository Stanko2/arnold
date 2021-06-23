
import { PDFdocument } from "./components/PDFdocument";
import { eventHub as ToolEvents, Tool } from "./components/Tools/Tool";
import { fabric } from "fabric";
import { PathAnnotation } from "./components/Annotation";

export class Canvas extends fabric.Canvas {
    static toolbarRef: any;

    dragStart: fabric.Point = new fabric.Point(0, 0);
    creating: fabric.Object | null = null;
    pageIndex = 0;
    drawnShapes: fabric.Path[] = [];
    selectedTool: Tool | undefined = undefined;
    constructor(el: any, private pdf: PDFdocument, private page: number) {
        super(el);
        this.selection = false;
        ToolEvents.$on('tool:select', (tool: Tool) => this.selectedTool = tool);
    }

    setScale(viewportSize: DOMRect) {
        if (this.pdf.modifyRef) {
            const { width, height } = this.pdf.modifyRef?.getPage(this.page).getSize();
            this.setZoom(viewportSize.width / width);
            this.setHeight(this.getWidth() * height / width);
        }
    }

    initEvents() {
        this.on('mouse:move', (e) => {
            if (this.creating != null) {
                console.log(this.creating);
                var position = this.getPointer(e.e);
                if (this.creating.type == 'line') {
                    (this.creating as fabric.Line).y2 = this.dragStart.y - position.y;
                    (this.creating as fabric.Line).x2 = this.dragStart.x - position.x;
                    return;
                }
                this.creating.set({
                    'height': Math.abs(this.dragStart.y - (position.y || 0)),
                    'width': Math.abs(this.dragStart.x - (position.x || 0)),
                })
            }
        });
        this.on('mouse:down', (e) => {
            if (e.absolutePointer == null) return;
            if (this.isDrawingMode) return;
            for (const annotation of this.pdf.annotations) {
                if (annotation.object.containsPoint(e.absolutePointer)) {
                    return;
                }
            }
            if (this.selectedTool && this.selectedTool.name != 'select' && this.getActiveObjects().length == 0 && this.selectedTool.defaultOptions != null) {
                var options = this.selectedTool.defaultOptions as fabric.IObjectOptions;
                const width = this.selectedTool.defaultOptions.width || 0;
                const height = this.selectedTool.defaultOptions.height || 0;
                options.top = e.absolutePointer?.y - height / 2;
                options.left = e.absolutePointer?.x - width / 2;
                this.selectedTool.defaultOptions = options;
                var pointerPos = this.getPointer(e.e);
                this.dragStart = new fabric.Point(pointerPos.x, pointerPos.y);
                this.creating = this.selectedTool.click?.(this.pdf, this.page, pointerPos);
                if (this.selectedTool.name == 'Arrow') {
                    (this.selectedTool.defaultOptions as fabric.ILineOptions).x1 = pointerPos.x;
                    (this.selectedTool.defaultOptions as fabric.ILineOptions).y1 = pointerPos.y;
                }
            }

        });
        this.on('object:scaling', (e) => {
            if (e.target?.type == 'textbox' || e.target?.type == 'activeSelection' || e.target?.type == 'path') {
                e.target?.setOptions({ scaleX: 1, scaleY: 1 });
            }

        });
        this.on('selection:cleared', (e) => {
            console.log('clr');

            if (this.selectedTool && this.selectedTool.name == 'select') {
                this.selectedTool.defaultOptions = {};
                Canvas.toolbarRef.$data.selectedOptions = {
                    hasFill: false,
                    hasStroke: false,
                    hasStrokeWidth: false,
                    hasText: false,
                };
            }
        });
        this.on('object:scaled', (e) => {
            if (e.target != null) {
                var obj: fabric.Object = e.target,
                    w = (obj.width || 0) * (obj.scaleX || 0),
                    h = (obj.height || 0) * (obj.scaleY || 0),
                    s = obj.strokeWidth || 0;

                obj.set({
                    'height': h,
                    'width': w,
                    'scaleX': 1,
                    'scaleY': 1
                });
            }
        });

        this.on('mouse:up', (e) => {
            this.creating = null;
            this.dragStart = new fabric.Point(0, 0);
        });
        this.on('selection:created', (e) => {
            if (this.selectedTool && this.selectedTool.name == 'Select') {
                console.log(this.getActiveObject());

                if (this.getActiveObject().type == 'activeSelection') return;
                PDFdocument.activeObject = this.getActiveObject();
                if (this.getActiveObject().type == 'path') {
                    Canvas.toolbarRef.$data.selectedTool.defaultOptions = { stroke: this.getActiveObject().stroke, strokeWidth: this.getActiveObject().strokeWidth };
                    Canvas.toolbarRef.$data.selectedOptions = { hasStrokeWidth: true, hasStroke: true, hasText: false, hasFill: false };
                    return;
                }
                var activeObjectTool = (this.getActiveObject() as any).tool;
                if (activeObjectTool != null) {
                    // TODO: fix hiding props on selection cleared or changed
                    Canvas.toolbarRef.$data.selectedTool.defaultOptions = activeObjectTool?.defaultOptions;
                    Canvas.toolbarRef.$data.selectedOptions = activeObjectTool.options;
                }
                this.pdf.pageCanvases.forEach(e => {
                    if (e != this) {
                        e.discardActiveObject();
                        e.renderAll();
                    }
                })
            }
        });
        this.on('object:added', (e) => {
            var obj = e.target;
            if (obj instanceof fabric.Path && this.isDrawingMode) {
                this.pdf.addAnnotation(new PathAnnotation(this.page, obj, this));
            }
        })
    }

    deleteSelected() {
        if (this.getActiveObjects().length == 0) return;
        for (const obj of this.getActiveObjects()) {
            if (obj.name)
                this.pdf.deleteAnnotation(obj.name);
        }
    }

    canOpenCtxMenu(e: Event): boolean {
        var cursor = this.getPointer(e);
        var point = new fabric.Point(cursor.x, cursor.y);
        if (this.getActiveObjects().length > 0) {
            return true;
        }
        return false;
    }

    updateObjectProps(newProps: fabric.IObjectOptions) {
        var obj = this.getActiveObject();
        newProps.top = obj.top;
        newProps.left = obj.left;
        newProps.width = obj.width;
        newProps.height = obj.height;
        obj.set(newProps);
    }
}