import { ifndef } from "./ifndef";
import { fetchFontFile } from "./fetchFontFile";
import { debounce } from "./debounce";
import { defaultCellRenderer } from "./defaultCellRenderer";
import { CanvasDatatableOptions, CellAlignment, CanvasDatatableState, CellRenderer, RenderOptions } from "./types";
import { hexToRGBA } from "./hexToRGBA";

const defaultOptions: CanvasDatatableOptions = {
    columns: [],
    initialData: [],
    rowHeight: 50,
    font: "'Titillium Web', sans-serif",
    fontSize: 14,
    fitToContainer: false,
    hoverColor: 'rgb(232,232,232)',
    selectedColor: 'rgb(200, 200, 200)'
}

const defaultRenderOptions = {
    noCache: false
}

export class CanvasDatatable {

    public static instances: CanvasDatatable[] = []
    public static fonts: string[] = []

    private data: any[]
    private options: CanvasDatatableOptions
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    private state: CanvasDatatableState
    private getEventHandlers: any
    private container: HTMLDivElement

    public constructor(canvas: HTMLCanvasElement, options: CanvasDatatableOptions = defaultOptions) {

        options.columns = ifndef(options.columns, [])
        options.initialData = ifndef(options.initialData, [])
        options.rowHeight = ifndef(options.rowHeight, defaultOptions.rowHeight)
        options.font = ifndef(options.font, defaultOptions.font)
        options.fitToContainer = ifndef(options.fitToContainer, defaultOptions.fitToContainer)
        options.fontSize = ifndef(options.fontSize, defaultOptions.fontSize)
        options.hoverColor = ifndef(options.hoverColor, defaultOptions.hoverColor)

        const { columns } = options

        const state: CanvasDatatableState = {
            mousedown: false,
            resizing: null,
            cols: [],
            fonts: [],
            hoverRowIndex: null
        }

        for (const col of columns) {
            state.cols.push({
                key: col.key,
                width: col.width || 110,
                renderCache: [],
                xRender: 0
            });
        }
        
        const onMouseDown = this.onMouseDown.bind(this)
        const onMouseMove = this.onMouseMove.bind(this)
        const onMouseUp = this.onMouseUp.bind(this)
        const onMouseLeave = this.onMouseLeave.bind(this)
        
        const debouncedOnMouseMove = debounce(onMouseMove, 0, true)

        canvas.addEventListener("mousemove", debouncedOnMouseMove);
        canvas.addEventListener("mousedown", onMouseDown);
        window.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("mouseleave", onMouseLeave)
        
        this.data = options.initialData
        this.options = options
        this.canvas = canvas
        this.ctx = canvas.getContext("2d", { alpha: true })
        this.state = state
        this.getEventHandlers = () => ({
            onMouseUp
        })
        this.container = document.createElement('div')
        this.container.style.position = 'relative'
        this.container.style.display = 'inline-block'
        this.canvas.parentNode.insertBefore(this.container, this.canvas)
        this.canvas.parentNode.removeChild(this.canvas)
        this.container.appendChild(this.canvas)
        CanvasDatatable.instances.push(this)

        this.render()
    }

    public static addWebFont(url: string) {
        
        let urlCSS = null
        const URL_RE = /url\(([^)]*)\)/g

        fetch(url).then(r => r.text())
            .then(css => {
                urlCSS = css
                const fontFilesCache = {}
                while (true) {
                    const match = URL_RE.exec(css)
                    if (!match) { break }
                    const [, fontUrl] = match
                    if (fontFilesCache[fontUrl]) { continue }
                    fontFilesCache[fontUrl] = fetchFontFile(fontUrl).then(css => ({ fontUrl, css }))
                }
                return Promise.all(Object.values(fontFilesCache))
            }).then(fonts => {
                const fontFilesCache = Object.assign.apply(null, fonts.map(
                    ({ fontUrl, css }) => ({ [fontUrl]: css }))
                )

                CanvasDatatable.fonts.push(urlCSS.replace(URL_RE, (_, fontUrl) => {
                    return `url(${fontFilesCache[fontUrl]})`
                }))

                for (const canvasDatatable of CanvasDatatable.instances) {
                    canvasDatatable.render({ noCache: true })
                }
            })
    }

    private getMousePos(evt: MouseEvent) {
        var rect = this.canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        }
    }

    private getColState(key: string) {
        return this.state.cols.find(col => col.key === key)
    }

    private onMouseMove(e: MouseEvent) {
        const { rowHeight } = this.options
        const { x, y } = this.getMousePos(e);
        const offset = 3;
        let offsetX = 0;
        const prevHoverRowIndex = this.state.hoverRowIndex
        this.state.hoverRowIndex = Math.floor(y / rowHeight) - 1
        if (prevHoverRowIndex !== this.state.hoverRowIndex) {
            // this.state.cols.forEach(colState => {
            //     colState.renderCache[this.state.hoverRowIndex] = null
            //     colState.renderCache[prevHoverRowIndex] = null
            // })
            this.render({ noCache: false })
        }
        if (!this.state.mousedown) {
            this.state.resizing = null
            for (const colState of this.state.cols) {
                const mouseoverdragX = (
                    y <= rowHeight &&
                    offsetX + colState.width - offset <= x && x <= offsetX + colState.width + offset
                )
                if (mouseoverdragX) {
                    this.canvas.style.cursor = "col-resize";
                    this.state.resizing = colState.key;
                    break;
                }
                offsetX += colState.width;
            }
        }
    
        if (!this.state.resizing) {
            this.canvas.style.cursor = "auto";
            return;
        }
        if (this.state.mousedown) {
            offsetX = 0;
            for (const colState of this.state.cols) {
                if (colState.key === this.state.resizing) {
                    colState.width = Math.max(110, x - offsetX);
                    this.render();
                    break;
                }
                offsetX += colState.width;
            }
        }
    }

    private onMouseDown() {
        this.state.mousedown = true;
    }
    
    private onMouseUp() {
        this.state.mousedown = false;
        this.state.resizing = null;
        this.canvas.style.cursor = "auto";
        this.render();
    }
    
    private onMouseLeave() {
        this.state.hoverRowIndex = -1
        this.state.resizing = null;
        this.canvas.style.cursor = "auto";
        this.render()
    }

    private renderSVGTemplate(html: string, width: number, height: number, fillStyle: string) : string {
        return String.raw`
            <svg xmlns="http://www.w3.org/2000/svg"
                width="${width}"
                height="${height}">
                <foreignObject width="100%" height="100%">
                    <body xmlns="http://www.w3.org/1999/xhtml">
                        <style>
                            ${CanvasDatatable.fonts.join("")}
                            body {
                                margin-left: 0;
                                margin-right: 0;
                                font-family: ${this.options.font}, sans-serif;
                                background-color: ${fillStyle}
                            }
                        </style>
                        ${html}
                    </body>
                </foreignObject>
            </svg>`
    }

    private renderHTML(
        html: string,
        x: number,
        y: number,
        cellWidth: number,
        cellHeight: number,
        alignment: CellAlignment
    ): Promise<CellRenderer> {

        const fillStyle = 'rgb(255,255,255)'
        
        return new Promise(resolve => {

            const div = document.createElement("div");
            div.style.position = 'fixed'
            div.style.top = '100vh'
            div.style.left = '100vw'
            div.innerHTML = html;
            document.body.appendChild(div);
            const width = div.offsetWidth + 12;
            const height = div.offsetHeight + 20;
            html = html.replace(/#/g, "%23");
            // background-color: ${fillStyle}

            div.parentElement.removeChild(div);
            const img = new Image();
            const imgHover = new Image();
            let imgHoverBitmap
            img.onload = () => {
                window.createImageBitmap(img).then(bitmap => {
                    const renderer = (x: number, y: number, cellWidth: number, fillStyle: string = 'rgba(255, 255, 255)') => {
                        let bitmapRender = bitmap
                        if (fillStyle === this.options.hoverColor) {
                            bitmapRender = imgHoverBitmap
                        }
                        x += 4
                        y += 4
                        const renderWidth = Math.min(width, cellWidth - 6)
                        const preDefArgs = [bitmapRender, 0, 0, renderWidth, height]
                        // const preDefArgs = [img, 0, 0, renderWidth, height]
                        let pos = [x, y]
                        const postDefArgs = [renderWidth, height]
                        switch (alignment) {
                            case 'right':
                                pos = [x + (cellWidth - width - 4), y]
                                break
                            case 'center':
                                pos = [x + (x + cellWidth - (x + width)) / 2, y]
                        }
                        this.ctx.fillStyle = fillStyle
                        this.ctx.fillRect(x - 4, y - 4, cellWidth, cellHeight - 1)

                        this.ctx.drawImage.apply(this.ctx, [...preDefArgs, ...pos, ...postDefArgs])
                    };
                    renderer(x, y, cellWidth, fillStyle);
                    resolve(renderer);
                })
            }
            img.src = String.raw`data:image/svg+xml;charset=utf-8,${this.renderSVGTemplate(html, width, height, fillStyle)}`;
            imgHover.src = String.raw`data:image/svg+xml;charset=utf-8,${this.renderSVGTemplate(html, width, height, this.options.hoverColor)}`
            imgHover.onload = () => {
                window.createImageBitmap(imgHover).then(bitmap => {
                    imgHoverBitmap = bitmap
                })
            }
            // console.log('img.src', img.src)
            // document.body.appendChild(img)
        });
    }

    private getColBgColor(dataIndex: number) : string {
        return this.state.hoverRowIndex === dataIndex ? this.options.hoverColor : hexToRGBA("#FFFFFF");
    }

    public render(renderOptions: RenderOptions = defaultRenderOptions) {

        const { noCache = false } = renderOptions

        const { rowHeight, columns, font, fontSize } = this.options

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.canvas.height = (this.data.length + 1) * rowHeight;
        this.canvas.width = this.state.cols.reduce((w, col) => w + col.width, 0);

        let xRender = 0,
            yRender = 0;

        columns.forEach((col, i) => {
            const { width } = this.getColState(col.key);
            this.ctx.strokeStyle = "#999";
            this.ctx.strokeRect(xRender, yRender, width, rowHeight);
            this.ctx.fillStyle = "#FFF";
            this.ctx.fillRect(xRender, yRender, width, rowHeight)
            this.ctx.fillStyle = "#000";
            this.ctx.textAlign = "center";
            this.ctx.font = `bold ${fontSize}px ${font}`;
            this.ctx.fillText(
                col.label || "",
                xRender + width / 2,
                rowHeight / 2 + 4,
                width
            );

            xRender += width;
        })

        xRender = 0;
        this.ctx.font = `normal ${fontSize}px ${font}`;
        this.ctx.fillStyle = "#FFF"
        this.data.forEach((d, dataIndex) => {
            xRender = 0;
            yRender += rowHeight;
            columns.forEach(col => {
                const colState = this.getColState(col.key);
                const { width, renderCache } = colState;
                this.ctx.strokeRect(xRender, yRender, width, rowHeight);
                this.ctx.fillRect(xRender - 1, yRender, width + 1, rowHeight)
                const { value, renderer } = renderCache[dataIndex] || {};
                const hasValueChanged = !(value === d[col.key] && renderer)
                const fillStyle = this.getColBgColor(dataIndex)
                if (!hasValueChanged) {
                    renderer(xRender, yRender, width, fillStyle);
                }
                if (noCache || hasValueChanged) {
                    Array.from(this.container.children).forEach(el => {
                        if (el.tagName.toLowerCase() === "img") {
                            el.parentNode.removeChild(el)
                        }
                    })
                    const html = (col.render || defaultCellRenderer)(d[col.key] || "", d, font)
                    this.renderHTML(html, xRender, yRender, width, rowHeight, col.align)
                        .then(renderer => {
                            renderCache[dataIndex] = {
                                value: d[col.key],
                                renderer
                            };
                        });
                }
                xRender += width;
            });
        });
    }

    public setData(data: any[]) {
        this.data = data
        this.render()
    }

    public dispose() {
        window.removeEventListener('mouseup', this.getEventHandlers().onMouseUp)
        CanvasDatatable.instances.splice(CanvasDatatable.instances.indexOf(this), 1)
    }
}