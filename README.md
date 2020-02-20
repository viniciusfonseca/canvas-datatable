canvas-datatable
================

Small library with zero dependencies for datagrid rendering inside a canvas.
It has features like custom web fonts, row selecting, column resizing and custom cell rendering.

__Demo__: https://codesandbox.io/s/canvas-datatable-cro4b

## Usage

Install with `npm`:

```
npm install --save canvas-datatable
```

Then import it and instantiate it with a `HTMLCanvasElement`:

```js
import { CanvasDatatable } from 'canvas-datatable'

const html = String.raw
const canvas = document.getElementsByTagName('canvas')[0]

const canvasDatatable = new CanvasDatatable(canvas, {
    columns: [{
        key: 'name',
        label: 'Name',
        // set some custom rendering for a column
        render(value) {
            return html`
                <span style="white-space: nowrap"> ${value} </span>
            `
        }
    }, {
        key: 'email',
        label: 'E-mail'
    }],
    initialData: [{
        name: 'foo',
        email: 'foo@example.com'
    }, {
        name: 'bar',
        email: 'bar@example.com'
    }, {
        name: 'John Doe',
        email: 'john.doe@example.com'
    }]
})

// updating the data when needed (the array passed to setData() will replace the current array)
canvasDatatable.setData([
    {
        name: 'only user in database',
        email: 'unique@example.com'
    }
])

// add some custom web font (note that you must use the class static method)
CanvasDatatable.addWebFont('https://fonts.googleapis.com/css?family=Titillium+Web')

// disposing it when the canvas isn't used anymore
canvasDatatable.dispose()
```

This project is still in development. If you want to contribute, send a mail to `vfonseca1618@gmail.com`.