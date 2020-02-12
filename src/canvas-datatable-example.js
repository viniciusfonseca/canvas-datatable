const html = String.raw;

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas-datatable");

const ctx = canvas.getContext("2d");

const columns = [
    { key: "name", label: "Nome", width: 130 },
    {
        key: "create_date",
        label: "Data de Cadastro",
        width: 200,
        align: 'center',
        render(value) {
            return html`
                <span
                    style="font-family: 'Titillium Web'; overflow-x: hidden; text-overflow: ellipsis; white-space: nowrap; background-color: #FFF"
                >
                    ${value ? new Date(value).toLocaleDateString() : "Não disponível"}
                </span>
            `;
        }
    },
    {
        key: "status",
        label: "Status",
        align: 'center',
        render(value) {
            const active = value === "active";
            return html`
                <span
                    style="font-weight: bold; padding: 6px; color: #FFF; background-color: ${active
                                ? "green"
                                : "#F00"}; font-family: 'Titillium Web'; border-radius: 7px;"
                    >
                    ${active ? "Ativo" : "Inativo"}
                </span>
            `;
        }
    },
    {
        key: "amount",
        label: "Valor",
        align: 'right',
        render(value) {
            return html`<span style="font-family: 'Titillium Web'; background-color: #FFF">
                ${formatter.format(value)}
            </span>`
        }
    },
    { key: "last_name", label: "Nome", width: 130 },
    {
        key: "update_date",
        label: "Data de Cadastro",
        width: 200,
        align: 'center',
        render(value) {
            return html`
                <span
                    style="font-family: 'Titillium Web'; overflow-x: hidden; text-overflow: ellipsis; white-space: nowrap; background-color: #FFF"
                >
                    ${value ? new Date(value).toLocaleDateString() : "Não disponível"}
                </span>
            `;
        }
    },
    {
        key: "next_status",
        label: "Status",
        align: 'center',
        render(value) {
            const active = value === "active";
            return html`
                <span
                    style="font-weight: bold; padding: 6px; color: #FFF; background-color: ${active
                            ? "green"
                            : "#F00"}; font-family: 'Titillium Web'; border-radius: 7px;"
                >
                    ${active ? "Ativo" : "Inativo"}
                </span>
            `;
        }
    },
    {
        key: "pending_amount",
        label: "Valor"
    }
];

const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

const data = x([
    {
        name: "Vinicius Fonseca",
        create_date: new Date().toISOString(),
        status: "active",
        last_name: "Vinicius Fonseca",
        update_date: new Date().toISOString(),
        next_status: "active",
        amount: 100.00,
    },
    {
        name: "John Doe",
        create_date: new Date().toISOString(),
        status: "active"
    },
    {
        name: "Fulano Beltrano",
        create_date: new Date().toISOString(),
        status: "inactive"
    }
], 16);

function x(a, n) {
    const result = []
    for (let i = 0; i < n; i++)
        for (const e of a)
            result.push(e)
    return result
}

const state = {
    mousedown: false,
    resizing: null,
    cols: [],
    fonts: []
};

function getMousePos(evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function init() {
    for (const col of columns) {
        state.cols.push({
            key: col.key,
            width: col.width || 110,
            renderCache: [],
            xRender: 0
        });
    }
}

function getColState(key) {
    return state.cols.find(col => col.key === key);
}

const rowHeight = 50;
const fontSize = 14;

function defaultCellRenderer(value) {
    return html`<span style="font-family: 'Titillium Web'; white-space: nowrap; background-color: #FFF">${value}</span>`
}

window.state = state

function render() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    canvas.height = (data.length + 1) * rowHeight;
    canvas.width = state.cols.reduce((w, col) => w + col.width, 0);

    let xRender = 0,
        yRender = 0;

    for (const col of columns) {
        const { width } = getColState(col.key);
        ctx.strokeStyle = "#999";
        ctx.fillStyle = "#FFF";
        ctx.strokeRect(xRender, yRender, width, rowHeight);
        ctx.fillRect(xRender, yRender, width, rowHeight)
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        ctx.font = `bold ${fontSize}px 'Titillium Web'`;
        ctx.fillText(
            col.label || "",
            xRender + width / 2,
            rowHeight / 2 + 4,
            width
        );

        xRender += width;
    }

    xRender = 0;
    ctx.font = `normal ${fontSize}px 'Titillium Web'`;
    ctx.fillStyle = "#FFF"
    data.forEach((d, dataIndex) => {
        xRender = 0;
        yRender += rowHeight;
        columns.forEach((col, j) => {
            const colState = getColState(col.key);
            const { width, renderCache } = colState;
            ctx.strokeRect(xRender, yRender, width, rowHeight);
            // ctx.fillStyle = j % 2 === 0 ? "#FF0" : "#F0F";
            ctx.fillRect(xRender - 1, yRender, width + 1, rowHeight)
            const { value, renderer } = renderCache[dataIndex] || {};
            if (value === d[col.key] && renderer) {
                renderer(xRender, yRender, width);
            } else {
                renderHTML(
                    ctx,
                    (col.render || defaultCellRenderer)(d[col.key] || ""),
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

function clearCache() {
    state.cols.forEach(col => {
        col.renderCache = []
    })
}

function onMouseMove(e) {
    const { x, y } = getMousePos(e);
    const offset = 3;
    let offsetX = 0;
    if (!state.mousedown) {
        state.resizing = false;
        for (const colState of state.cols) {
            const mouseoverdragX =
                y <= rowHeight &&
                offsetX + colState.width - offset <= x && x <= offsetX + colState.width + offset;
            if (mouseoverdragX) {
                canvas.style.cursor = "col-resize";
                state.resizing = colState.key;
                break;
            }
            offsetX += colState.width;
        }
    }

    if (!state.resizing) {
        canvas.style.cursor = "auto";
        return;
    }
    if (state.mousedown) {
        offsetX = 0;
        for (const colState of state.cols) {
            if (colState.key === state.resizing) {
                colState.width = Math.max(110, x - offsetX);
                render();
                break;
            }
            offsetX += colState.width;
        }
    }
}
function onMouseDown() {
    state.mousedown = true;
}

function onMouseUp() {
    state.mousedown = false;
    state.resizing = null;
    canvas.style.cursor = "auto";
    render();
}

function onMouseLeave() {
    state.resizing = null;
    canvas.style.cursor = "auto";
}

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

const debouncedOnMouseMove = debounce(onMouseMove, 1, true)

canvas.addEventListener("mousemove", debouncedOnMouseMove);
canvas.addEventListener("mousedown", onMouseDown);
window.addEventListener("mouseup", onMouseUp);
canvas.addEventListener("mouseleave", onMouseLeave);

function renderHTML(ctx, html, x, y, cellWidth, cellHeight, alignment) {
    return new Promise(resolve => {

        const div = document.createElement("div");
        div.style = "position: fixed; top: 100vh; left: 100vw";
        div.innerHTML = html;
        document.body.appendChild(div);
        const width = div.offsetWidth + 7;
        const height = div.offsetHeight + 14;
        html = html.replace(/#/g, "%23");

        const data = `data:image/svg+xml;charset=utf-8,
            <svg xmlns="http://www.w3.org/2000/svg"
                width="${width}"
                height="${height}">
                <foreignObject width="100%" height="100%">
                    <body xmlns="http://www.w3.org/1999/xhtml">
                        <style>
                            ${state.fonts.join("")}
                            body { margin-left: 0; margin-right: 0 }
                        </style>
                        ${html}
                    </body>
                </foreignObject>
            </svg>    
        `;
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
                    ctx.drawImage.apply(ctx, [...preDefArgs, ...pos, ...postDefArgs])
                };
                renderer(x, y, cellWidth);
                resolve(renderer);
            })
        img.src = data;
    });
}

async function addWebFont(url) {
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
    state.fonts.push(css.replace(URL_RE, (_, fontUrl) => {
        return `url(${fontFilesCache[fontUrl]})`
    }))
    clearCache()
    render()
}

async function fetchFontFile(fontFileURL) {
    return new Promise(resolve => {
        fetch(fontFileURL).then(r => r.blob()).then(b => {
            const fr = new FileReader()
            fr.onload = function() { resolve(this.result) }
            fr.readAsDataURL(b)
        })
    })
}

init();
render();
addWebFont('https://fonts.googleapis.com/css?family=Titillium+Web')
