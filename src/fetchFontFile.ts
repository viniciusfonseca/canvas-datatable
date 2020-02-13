export function fetchFontFile(fontFileURL) {
    return new Promise(resolve => {
        fetch(fontFileURL).then(r => r.blob()).then(b => {
            const fr = new FileReader()
            fr.onload = function() { resolve(this.result) }
            fr.readAsDataURL(b)
        })
    })
}