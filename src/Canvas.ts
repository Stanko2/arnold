
import { PDFdocument } from "./components/PDFdocument";
import { tools } from "./components/Tools/Tool";
import { fabric } from "fabric";
import { ImageAnnotation, PathAnnotation, SignAnnotation } from "@/Annotation";
import eventHub from "./Mixins/EventHub";
import { Tool } from "./@types";
export class Canvas extends fabric.Canvas {
    Clear(): void {
        try {
            super.dispose();
        }
        catch (e) {
            return;
        }
    }
    static toolbarRef: any;

    creating: fabric.Object | null = null;
    pageIndex = 0;
    drawnShapes: fabric.Path[] = [];
    static selectedTool: Tool | undefined = undefined;
    initialized = false;
    constructor(el: any, private pdf: PDFdocument, private page: number) {
        super(el);
        this.selection = false;
        eventHub.$on('tool:select', (tool: Tool) => Canvas.selectedTool = tool);
    }


    setScale(viewportSize: { width: number, height: number }) {
        if (this.pdf.modifyRef && this.initialized) {
            const { width, height } = this.pdf.modifyRef?.getPage(this.page).getSize();
            this.setZoom(viewportSize.width / width);
        }
    }

    initEvents() {
        this.on('mouse:down', (e) => {
            if (e.absolutePointer == null) return;
            if (this.isDrawingMode) return;
            for (const annotation of this.pdf.annotations) {
                if (annotation.object.containsPoint(e.absolutePointer)) {
                    return;
                }
            }
            if (Canvas.selectedTool && Canvas.selectedTool.name != 'Select' && this.getActiveObjects().length == 0 && Canvas.selectedTool.defaultOptions) {
                console.log(Canvas.selectedTool.name);
                var options = Canvas.selectedTool.defaultOptions as fabric.IObjectOptions;
                const width = Canvas.selectedTool.defaultOptions.width || 0;
                const height = Canvas.selectedTool.defaultOptions.height || 0;
                options.top = e.absolutePointer?.y - height / 2;
                options.left = e.absolutePointer?.x - width / 2;
                Canvas.selectedTool.defaultOptions = options;
                const pointerPos = this.getPointer(e.e);
                if (Canvas.selectedTool.name == 'Arrow') {
                    (Canvas.selectedTool.defaultOptions as fabric.ILineOptions).x1 = pointerPos.x;
                    (Canvas.selectedTool.defaultOptions as fabric.ILineOptions).y1 = pointerPos.y;
                }
                else {
                    this.creating = Canvas.selectedTool.click?.(this.pdf, this.page, pointerPos);
                    if (this.creating) {
                        this.setActiveObject(this.creating);
                        this.requestRenderAll();
                        eventHub.$emit('tool:select', tools[7]);
                    }
                }
            }

        });
        this.on('mouse:up', (e) => {
            if (this.isDrawingMode) return;
            const pointerPos = e.absolutePointer || new fabric.Point(0, 0);
            if (Canvas.selectedTool && Canvas.selectedTool.name == 'Arrow') {
                (Canvas.selectedTool.defaultOptions as fabric.ILineOptions).x2 = pointerPos.x;
                (Canvas.selectedTool.defaultOptions as fabric.ILineOptions).y2 = pointerPos.y;
                this.creating = Canvas.selectedTool.click?.(this.pdf, this.page, pointerPos);
                this.setActiveObject(this.creating);
                this.requestRenderAll();
            }
        })
        this.on('object:scaling', (e) => {
            if (e.target?.type == 'textbox' || e.target?.type == 'activeSelection') {
                e.target?.setOptions({ scaleX: 1, scaleY: 1 });
            }

        });
        this.on('selection:cleared', (e) => {
            if (Canvas.selectedTool && Canvas.selectedTool.name == 'Select') {
                Canvas.selectedTool.defaultOptions = {};
                Canvas.toolbarRef.$data.selectedTool.defaultOptions = {};
                Canvas.toolbarRef.$data.selectedOptions = {
                    hasFill: false,
                    hasStroke: false,
                    hasStrokeWidth: false,
                    hasText: false,
                };
            }
        });
        this.on('object:scaled', (e) => {
            if (e.target != null && e.target.type != 'group' && e.target.type != 'ellipse' && e.target.type != 'image') {
                const obj: fabric.Object = e.target,
                    w = (obj.width || 0) * (obj.scaleX || 0),
                    h = (obj.height || 0) * (obj.scaleY || 0);

                obj.set({
                    'height': h,
                    'width': w,
                    'scaleX': 1,
                    'scaleY': 1
                });
            }
            else if (e.target && e.target.type == 'ellipse') {
                const obj: fabric.Ellipse = e.target as fabric.Ellipse,
                    w = (obj.rx || 0) * (obj.scaleX || 0),
                    h = (obj.ry || 0) * (obj.scaleY || 0);

                obj.set({
                    'ry': h,
                    'rx': w,
                    'scaleX': 1,
                    'scaleY': 1
                });
            }
        });
        this.on('selection:updated', this.HandleSelectionChanged);
        this.on('selection:created', this.HandleSelectionChanged);



        setTimeout(() => {
            this.on('object:added', (e) => {
                var obj = e.target;
                if (obj instanceof fabric.Path && this.isDrawingMode) {
                    this.pdf.addAnnotation(new PathAnnotation(this.page, obj, this));
                }
                if (obj instanceof fabric.Group && !this.getObjects().some(e => e.type == 'group' && e.name == obj?.name && e != obj)) {
                    console.log((obj as any).sign);

                    this.pdf.addAnnotation(new SignAnnotation(this.page, obj as any, this));
                }
                if (obj instanceof fabric.Image) {
                    this.pdf.addAnnotation(new ImageAnnotation(this.page, obj, this))
                }
            })
            this.initialized = true;
            this.discardActiveObject();
        }, 100);
    }
    HandleSelectionChanged() {
        if (this.selection) {
            const activeObject = this.getActiveObject();

            if (activeObject.type == 'activeSelection') return;
            PDFdocument.activeObject = activeObject;

            if (activeObject.type == 'path') {
                Canvas.toolbarRef.$data.selectedTool.defaultOptions = { stroke: activeObject.stroke, strokeWidth: activeObject.strokeWidth };
                Canvas.toolbarRef.$data.selectedOptions = { hasStrokeWidth: true, hasStroke: true, hasText: false, hasFill: false };
                return;
            }
            else if (activeObject.type == 'group') {
                const obj = (activeObject as fabric.Group).getObjects()[0];
                Canvas.toolbarRef.$data.selectedTool.defaultOptions = { stroke: obj.stroke, strokeWidth: obj.strokeWidth };
                Canvas.toolbarRef.$data.selectedOptions = { hasStrokeWidth: true, hasStroke: true, hasText: false, hasFill: false };
                return;
            }
            var activeObjectTool = (activeObject as any).tool;
            if (activeObjectTool != null) {
                Canvas.toolbarRef.$data.selectedTool.defaultOptions = {
                    stroke: activeObject.stroke,
                    strokeWidth: activeObject.strokeWidth,
                    fill: activeObject.fill,
                    fontFamily: (activeObject as fabric.Textbox).fontFamily,
                    fontSize: (activeObject as fabric.Textbox).fontSize
                };
                Canvas.toolbarRef.$data.selectedOptions = activeObjectTool.options;
            }
            this.pdf.pageCanvases.forEach(e => {
                if (e != this) {
                    e.discardActiveObject();
                    e.renderAll();
                }
            })
        }
    }

    deleteSelected() {
        if (this.getActiveObjects().length == 0) return;
        for (const obj of this.getActiveObjects()) {
            if (obj.name)
                this.pdf.deleteAnnotation(obj.name);
        }
    }

    setSelectable(selection: boolean) {
        this.selection = selection;
        this.discardActiveObject();
        this.getObjects().forEach(obj => {
            obj.selectable = selection;
        });
        this.requestRenderAll();
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
    Rotate(angle: number) {
        const rads = fabric.util.degreesToRadians(angle);
        console.log(this.viewportTransform);

        const rotate = fabric.util.multiplyTransformMatrices([1, 0, 0, 1, (this.width || 0) / 2, (this.height || 0) / 2], [Math.cos(rads), Math.sin(rads), -Math.sin(rads), Math.cos(rads), 0, 0])
        if (this.viewportTransform)
            this.viewportTransform = fabric.util.multiplyTransformMatrices(this.viewportTransform || [1, 0, 0, 1, 0, 0], rotate);
        this.renderAll();
    }
}