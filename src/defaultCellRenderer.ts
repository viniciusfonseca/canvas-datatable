const html = String.raw

export function defaultCellRenderer(value: string, row: any, font: string) {
    return html`
        <span style="font-family: ${font}; white-space: nowrap">
            ${value}
        </span>`
}