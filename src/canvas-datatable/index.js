import { ifndef } from "./ifndef";
import { fetchFontFile } from "./fetchFontFile";
import { debounce } from "./debounce";
import { defaultCellRenderer } from "./defaultCellRenderer";

const defaultOptions = {
    columns: [],
    initialData: [],
    rowHeight: 50,
    font: "'Titillium Web' sans-serif",
    fontSize: 14,
    fitToContainer: false
}

export class CanvasDatatable {

    /**
     *
     * @param {HTMLCanvasElement} canvas
     * @param {import(".").CanvasDatatableOptions} options
     */
    constructor(canvas, options = defaultOptions) {

        options.columns = ifndef(options.columns, [])
        options.initialData = ifndef(options.initialData, [])
        options.rowHeight = ifndef(options.rowHeight, defaultOptions.rowHeight)
        options.font = ifndef(options.font, defaultOptions.font)
        options.fitToContainer = ifndef(options.fitToContainer, defaultOptions.fitToContainer)
        options.fontSize = ifndef(options.fontSize, defaultOptions.fontSize)

        const { columns } = options

        const state = {
            mousedown: false,
            resizing: null,
            cols: [],
            fonts: []
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
        
        const debouncedOnMouseMove = debounce(onMouseMove, 1, true)

        canvas.addEventListener("mousemove", debouncedOnMouseMove);
        canvas.addEventListener("mousedown", onMouseDown);
        window.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("mouseleave", onMouseLeave)
        
        this.data = options.initialData
        this.options = options
        this.canvas = canvas
        this.ctx = canvas.getContext("2d")
        this.state = state
        this.getEventHandlers = () => ({
            onMouseUp
        })
        CanvasDatatable.instances.push(this)

        this.render()
    }

    static async addWebFont(url) {
        const css = await fetch(url).then(r => r.text())
        const URL_RE = /url\(([^)]*)\)/g
        const fontFilesCache = {}
        while (true) {
            const match = URL_RE.exec(css)
            if (!match) { break }
            const [, fontUrl] = match
            if (fontFilesCache[fontUrl]) { continue }
            fontFilesCache[fontUrl] = await fetchFontFile(fontUrl)
        }
        CanvasDatatable.fonts.push(css.replace(URL_RE, (_, fontUrl) => {
            return `url(${fontFilesCache[fontUrl]})`
        }))
        for (const canvasDatatable of CanvasDatatable.instances) {
            canvasDatatable.clearCache()
            canvasDatatable.render()
        }
    }

    getMousePos(evt) {
        var rect = this.canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        }
    }

    getColState(key) {
        return this.state.cols.find(col => col.key === key)
    }

    onMouseMove(e) {
        const { rowHeight } = this.options
        const { x, y } = this.getMousePos(e);
        const offset = 3;
        let offsetX = 0;
        if (!this.state.mousedown) {
            this.state.resizing = false;
            for (const colState of this.state.cols) {
                const mouseoverdragX =
                    y <= rowHeight &&
                    offsetX + colState.width - offset <= x && x <= offsetX + colState.width + offset;
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

    onMouseDown() {
        this.state.mousedown = true;
    }
    
    onMouseUp() {
        this.state.mousedown = false;
        this.state.resizing = null;
        this.canvas.style.cursor = "auto";
        this.render();
    }
    
    onMouseLeave() {
        this.state.resizing = null;
        this.canvas.style.cursor = "auto";
    }

    renderHTML(html, x, y, cellWidth, cellHeight, alignment) {
        return new Promise(resolve => {

            const div = document.createElement("div");
            div.style = "position: fixed; top: 100vh; left: 100vw";
            div.innerHTML = html;
            document.body.appendChild(div);
            const width = div.offsetWidth + 5;
            const height = div.offsetHeight + 14;
            html = html.replace(/#/g, "%23");
    
            const data = String.raw`data:image/svg+xml;charset=utf-8,
                <svg xmlns="http://www.w3.org/2000/svg"
                    width="${width}"
                    height="${height}">
                    <foreignObject width="100%" height="100%">
                        <body xmlns="http://www.w3.org/1999/xhtml">
                            <style>
                                ${CanvasDatatable.fonts.join("")}
                                body { margin-left: 0; margin-right: 0 }
                            </style>
                            ${html}
                        </body>
                    </foreignObject>
                </svg>    
            `

            div.parentElement.removeChild(div);
            const img = new Image();
            img.onload = () =>
                window.createImageBitmap(img).then(bitmap => {
                    const renderer = (x, y, cellWidth) => {
                        x += 4
                        y += 4
                        const renderWidth = Math.min(width, cellWidth - 6)
                        const preDefArgs = [bitmap, 0, 0, renderWidth, height]
                        let pos = [x, y]
                        const postDefArgs = [renderWidth, height]
                        switch (alignment) {
                            case 'right':
                                pos = [x + (cellWidth - width - 4), y]
                                break
                            case 'center':
                                pos = [x + (x + cellWidth - (x + width)) / 2, y]
                        }
                        this.ctx.drawImage.apply(this.ctx, [...preDefArgs, ...pos, ...postDefArgs])
                    };
                    renderer(x, y, cellWidth);
                    resolve(renderer);
                })
            img.src = data;
        });
    }

    clearCache() {
        this.state.cols.forEach(col => {
            col.renderCache = []
        })
    }

    render() {
        const { rowHeight, columns, font, fontSize } = this.options

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.canvas.height = (this.data.length + 1) * rowHeight;
        this.canvas.width = this.state.cols.reduce((w, col) => w + col.width, 0);

        let xRender = 0,
            yRender = 0;

        for (const col of columns) {
            const { width } = this.getColState(col.key);
            this.ctx.strokeStyle = "#999";
            this.ctx.fillStyle = "#FFF";
            this.ctx.strokeRect(xRender, yRender, width, rowHeight);
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
        }

        xRender = 0;
        this.ctx.font = `normal ${fontSize}px ${font}`;
        this.ctx.fillStyle = "#FFF"
        this.data.forEach((d, dataIndex) => {
            xRender = 0;
            yRender += rowHeight;
            columns.forEach((col, j) => {
                const colState = this.getColState(col.key);
                const { width, renderCache } = colState;
                this.ctx.strokeRect(xRender, yRender, width, rowHeight);
                // ctx.fillStyle = j % 2 === 0 ? "#FF0" : "#F0F";
                this.ctx.fillRect(xRender - 1, yRender, width + 1, rowHeight)
                const { value, renderer } = renderCache[dataIndex] || {};
                if (value === d[col.key] && renderer) {
                    renderer(xRender, yRender, width);
                } else {
                    this.renderHTML(
                        (col.render || defaultCellRenderer)(d[col.key] || "", font),
                        xRender,
                        yRender,
                        width,
                        rowHeight,
                        col.align
                    ).then(renderer => {
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

    setData(data) {
        this.data = data
        this.render()
    }

    dispose() {
        window.removeEventListener('mouseup', this.getEventHandlers().onMouseUp)
        CanvasDatatable.instances.splice(CanvasDatatable.instances.indexOf(this), 1)
    }
}

/** @type {string[]} */
CanvasDatatable.fonts = []

/** @type {CanvasDatatable[]} */
CanvasDatatable.instances = []