export function hexToRGBA(color: string) {
    try {
        color = color.replace('#', "")
        if (color.length === 3) {
            const colors = color.match(/[0-F]/gi)
            if (colors.length !== 3) { throw "" }
            return `rgba(${colors.map(c => parseInt(c.repeat(2), 16)).join()})`
        }
        else if (color.length === 6) {
            const colors = color.match(/[0-F]{2}/gi)
            if (colors.length !== 3) { throw "" }
            return `rgba(${colors.map(c => parseInt(c, 16)).join()})`
        }
        throw ""
    }
    catch (e) {
        throw new Error("Not a valid RGB color!")
    }
}