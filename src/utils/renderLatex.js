// Utility to render LaTeX to PNG using mathjax-full (SVG output) and sharp for rasterization
const sharp = require("sharp");

// Lazy-initialize MathJax components once per process
let mathjax, TeX, SVG, liteAdaptor, RegisterHTMLHandler, AllPackages, adaptor, tex, svg;

function initMathJax() {
    if (mathjax) return;
    ({ mathjax } = require("mathjax-full/js/mathjax.js"));
    ({ TeX } = require("mathjax-full/js/input/tex.js"));
    ({ SVG } = require("mathjax-full/js/output/svg.js"));
    ({ liteAdaptor } = require("mathjax-full/js/adaptors/liteAdaptor.js"));
    ({ RegisterHTMLHandler } = require("mathjax-full/js/handlers/html.js"));
    ({ AllPackages } = require("mathjax-full/js/input/tex/AllPackages.js"));

    adaptor = liteAdaptor();
    RegisterHTMLHandler(adaptor);

    tex = new TeX({ packages: AllPackages });
    svg = new SVG({ fontCache: "none" });
}

/**
 * Render a LaTeX string to an SVG string.
 * @param {string} latex
 * @param {{display?: boolean}} [options]
 * @returns {string} SVG markup
 */
function renderLatexToSvg(latex, options = {}) {
    initMathJax();
    const html = mathjax.document("", { InputJax: tex, OutputJax: svg });
    const node = html.convert(latex, { display: options.display !== false });
    const svgStr = adaptor.innerHTML(node);
    return svgStr;
}

/**
 * Render a LaTeX string to a PNG Buffer.
 * @param {string} latex
 * @param {{display?: boolean, padding?: number, scale?: number, background?: string}} [options]
 * @returns {Promise<Buffer>} PNG buffer
 */
async function renderLatexToPng(latex, options = {}) {
    const padding = Number.isFinite(options.padding) ? options.padding : 12;
    const background = options.background || "transparent"; // or "#ffffff"
    const scale = Number.isFinite(options.scale) ? options.scale : 1.0;

    const svgStr = renderLatexToSvg(latex, { display: options.display });

    // Optionally scale by wrapping in an outer SVG with transform
    const scaledSvg = scale !== 1.0
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <g transform="scale(${scale})">${svgStr}</g>
</svg>`
        : svgStr;

    // Convert to PNG using sharp; add padding by extending the canvas
    let image = sharp(Buffer.from(scaledSvg)).png();
    const meta = await image.metadata();
    const width = (meta.width || 0) + padding * 2;
    const height = (meta.height || 0) + padding * 2;

    image = sharp({
        create: {
            width: Math.max(width, 1),
            height: Math.max(height, 1),
            channels: 4,
            background,
        },
    })
        .composite([
            { input: Buffer.from(scaledSvg), top: padding, left: padding },
        ])
        .png();

    return await image.toBuffer();
}

module.exports = {
    renderLatexToSvg,
    renderLatexToPng,
};
