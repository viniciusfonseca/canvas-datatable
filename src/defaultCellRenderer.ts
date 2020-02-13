const html = String.raw

export function defaultCellRenderer(value, font) {
    return html`
        <span style="font-family: ${font}; white-space: nowrap; background-color: #FFF">
            ${value}
        </span>`
}