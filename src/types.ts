export type CanvasDatatableOptions = Partial<{
    columns: ColumnDefinition[]
    initialData: any[]
    rowHeight: number
    font: string
    fontSize: number
    fitToContainer: boolean
}>

export type ColumnDefinition = Partial<{
    key: string
    label: string
    width: number,
    align: 'left' | 'center' | 'right',
    render(value: string): string
}>