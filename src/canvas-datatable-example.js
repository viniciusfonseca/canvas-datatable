import { CanvasDatatable } from ".";
import { hexToRGBA } from "./hexToRGBA";

const html = String.raw;

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas-datatable");

/** @type {import("./canvas-datatable").ColumnDefinition[]} */
const columns = [
    { key: "name", label: "Nome", width: 130 },
    {
        key: "create_date",
        label: "Data de Cadastro",
        width: 200,
        align: 'center',
        render(value) {
            return html`
                <span style="overflow-x: hidden; white-space: nowrap;">
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
                                : "#F00"}; border-radius: 7px;"
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
            return html`
                <span> ${formatter.format(value)} </span>
            `
        }
    },
    { key: "last_name", label: "Nome", width: 130 },
    {
        key: "update_date",
        label: "Data de Atualização",
        width: 200,
        align: 'center',
        render(value) {
            return html`
                <span style="overflow-x: hidden; white-space: nowrap;">
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
                            : "#F00"}; border-radius: 7px;"
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
], 10);

function x(a, n) {
    const result = []
    for (let i = 0; i < n; i++)
        for (const e of a)
            result.push(e)
    return result
}

CanvasDatatable.addWebFont('https://fonts.googleapis.com/css?family=Titillium+Web')

new CanvasDatatable(canvas, {
    initialData: data,
    columns,
    hoverColor: hexToRGBA("#eff4ff"),
    selectedColor: hexToRGBA('#d0dfff')
})

canvas.addEventListener("rowselect", e => {
    console.log('row selected: ', e.detail.index)
})

canvas.addEventListener("colresize", e => {
    console.log('new cols width', e.detail)
})