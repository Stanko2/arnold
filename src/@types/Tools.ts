import { PDFdocument } from "@/components/PDFdocument";

export interface Tool {
    defaultOptions: fabric.IObjectOptions,
    click(pdf: PDFdocument, page: number, position: { x: number, y: number }): fabric.Object,
    mouseMove: Function,
    mouseUp: Function,
    cursor: string,
    icon: string,
    name: string,
    tooltip: string,
    onSelect(): void,
    onDeselect(): void,
    options: any,
    shortcut: string,
}