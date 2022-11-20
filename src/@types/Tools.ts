import { PDFdocument } from "@/components/PDFdocument";

export interface Tool<T extends fabric.IObjectOptions> {
    defaultOptions: T,
    click(pdf: PDFdocument, page: number, position: { x: number, y: number }): Promise<fabric.Object>,
    mouseMove: Function,
    mouseUp: Function,
    cursor: string,
    icon: string,
    name: string,
    tooltip: string,
    onSelect(): void,
    onDeselect(): void,
    options: ToolOptions,
    shortcut: string,
}

export interface ToolOptions {
    hasText: boolean,
    hasStroke: boolean,
    hasStrokeWidth: boolean,
    hasFill: boolean,
}

export interface ScoringCriteria {
    id: string;
    points: number;
    from: string;
}

export interface Font {
    url: string;
    viewport: string;
    pdf: string;
    bold?: string;
    italic?: string; 
    boldItalic?: string;
}