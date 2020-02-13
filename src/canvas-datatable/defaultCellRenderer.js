const html = String.raw

export function defaultCellRenderer(value, font) {

    console.log(html`
    <span style="font-family: ${font}; white-space: nowrap; background-color: #FFF">
        ${value}
    </span>`)

    return html`
        <span style="font-family: ${font}; white-space: nowrap; background-color: #FFF">
            ${value}
        </span>`
}