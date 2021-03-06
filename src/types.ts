export type CellAlignment = 'left' | 'center' | 'right'

export type CellRenderer = (x: number, y: number, cellWidth: number, fillStyle?: string) => void

export type CanvasDatatableOptions = Partial<{
    columns: ColumnDefinition[]
    initialData: any[]
    rowHeight: number
    font: string
    fontSize: number
    fitToContainer: boolean
    hoverColor: string
    selectedColor: string
}>

export type ColumnDefinition = Partial<{
    key: string
    label: string
    width: number
    align: CellAlignment
    render(value: string, row: any): string
}>


export type RenderOptions = Partial<{
    noCache: boolean
}>

export interface ColumnState {
    key: string
    width: number
    renderCache: ColumnRenderCache[],
    xRender: number
}

export interface ColumnRenderCache {
    value: string
    renderer: CellRenderer
    release: () => void
}

export interface CanvasDatatableState {
    mousedown: boolean
    resizing: string | null
    cols: ColumnState[]
    fonts: string[]
    hoverRowIndex: number | null
    selectedRowIndex: number | null
}