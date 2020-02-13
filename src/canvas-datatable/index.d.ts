export interface CanvasDatatableOptions {

    columns: ColumnDefinition[]
    initialData: any[]
    rowHeight: number
    font: string
    fontSize: number
}

export interface ColumnDefinition {
    key: string
    label: string
    width: number,
    align: 'left' | 'center' | 'right',
    render(value: string): string
}

export class CanvasDatatable {
    constructor(canvas: HTMLCanvasElement, options?: CanvasDatatableOptions)
    static addWebFont(url: string): void
    setData(data: any[]): void
}