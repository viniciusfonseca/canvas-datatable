import { CanvasDatatableOptions, RenderOptions } from "./types";
export as namespace CanvasDatatable
export declare class CanvasDatatable {
    static instances: CanvasDatatable[];
    static fonts: string[];
    private data;
    private options;
    private canvas;
    private ctx;
    private state;
    private getEventHandlers;
    constructor(canvas: HTMLCanvasElement, options?: CanvasDatatableOptions);
    static addWebFont(url: string): void;
    private getMousePos;
    private getColState;
    private onMouseMove;
    private onMouseDown;
    private onMouseUp;
    private onMouseLeave;
    private onMouseClick;
    private renderSVGTemplate;
    private renderHTML;
    private getColBgColor;
    render(renderOptions?: RenderOptions): void;
    setData(data: any[]): void;
    dispose(): void;
}