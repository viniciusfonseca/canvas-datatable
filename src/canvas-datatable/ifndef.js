export function ifndef(exp, fallback) {
    return typeof exp === 'undefined' ? fallback : exp
}