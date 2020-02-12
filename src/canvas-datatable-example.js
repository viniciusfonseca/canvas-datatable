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
                    style="font-family: sans-serif; overflow-x: hidden; text-overflow: ellipsis; white-space: nowrap"
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
                    : "#F00"}; font-family: sans-serif; border-radius: 7px;"
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
            return html`<span style="font-family: sans-serif;">
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
                    style="font-family: sans-serif; overflow-x: hidden; text-overflow: ellipsis; white-space: nowrap"
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
                            : "#F00"}; font-family: sans-serif; border-radius: 7px;"
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
    { name: "John Doe", create_date: new Date().toISOString(), status: "active" },
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
    frame: -1,
    mousedown: false,
    resizing: null,
    cols: []
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

const rowHeight = 40;
const fontSize = 12;

function defaultCellRenderer(value) {
    return html`<span style="font-family: sans-serif; white-space: nowrap">${value}</span>`
}

window.state = state

function render() {
    if (state.frame++ === Number.MAX_SAFE_INTEGER) {
        state.frame = -1;
    }

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
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillText(
            col.label || "",
            xRender + width / 2,
            rowHeight / 2 + 4,
            width
        );

        xRender += width;
    }

    xRender = 0;
    ctx.font = `normal ${fontSize}px sans-serif`;
    ctx.fillStyle = "#FFF";

    data.forEach((d, dataIndex) => {
        xRender = 0;
        yRender += rowHeight;
        columns.forEach(col => {
            const colState = getColState(col.key);
            const { width, renderCache } = colState;
            ctx.strokeRect(xRender, yRender, width, rowHeight);
            ctx.fillRect(xRender, yRender, width, rowHeight)
            const { value, renderer } = renderCache[dataIndex] || {};
            if (value === d[col.key] && renderer) {
                renderer.frame = state.frame;
                renderer(xRender, yRender, width);
            } else {
                renderHTML(
                    ctx,
                    (col.render || defaultCellRenderer)(d[col.key] || ""),
                    xRender,
                    yRender,
                    width,
                    rowHeight,
                    state.frame,
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

function onMouseMove(e) {
    const { x } = getMousePos(e);
    const offset = 3;
    let offsetX = 0;
    if (!state.mousedown) {
        state.resizing = false;
        for (const colState of state.cols) {
            const mouseoverdragX =
                offsetX + colState.width - offset <= x &&
                x <= offsetX + colState.width + offset;
            if (mouseoverdragX) {
                document.body.style.cursor = "col-resize";
                state.resizing = colState.key;
                break;
            }
            offsetX += colState.width;
        }
    }

    if (!state.resizing) {
        document.body.style.cursor = "auto";
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
    document.body.style.cursor = "auto";
    render();
}

function onMouseLeave() {
    state.resizing = null;
    document.body.style.cursor = "auto";
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

function renderHTML(ctx, html, x, y, cellWidth, cellHeight, frame, alignment) {
    return new Promise(resolve => {

        const div = document.createElement("div");
        div.style = "position: fixed; top: 100vh; left: 100vw";
        div.innerHTML = html;
        document.body.appendChild(div);
        const width = div.offsetWidth + 10;
        const height = div.offsetHeight + 15;
        html = html.replace(/#/g, "%23");

        const data = `data:image/svg+xml;charset=utf-8,
            <svg xmlns="http://www.w3.org/2000/svg"
                width="${width}"
                height="${height}">
                <foreignObject width="100%" height="100%">
                <body xmlns="http://www.w3.org/1999/xhtml">
                    ${html}
                </body>
                </foreignObject>
            </svg>    
        `;
        div.parentElement.removeChild(div);
        const img = new Image();
        img.onload = () => {
            const renderer = (x, y, cellWidth) => {
                y += 4
                if (renderer.frame === state.frame) {
                    const renderWidth = Math.min(width, cellWidth - 6)
                    const preDefArgs = [img, 0, 0, renderWidth, height]
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
                }
            };
            renderer.frame = frame;
            renderer(x, y, cellWidth);
            resolve(renderer);
        };
        img.src = data;
    });
}

init();
render();
