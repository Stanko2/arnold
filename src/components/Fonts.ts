import { StandardFonts } from 'pdf-lib';
import { PDFdocument } from './PDFdocument';
import { Font } from '@/@types';
declare let FontFace: any;


export const FontsAvailable: Record<string, Font> = {
    'Open Sans': {
        url: 'https://fonts.googleapis.com/css2?family=Open+Sans&display=swap',
        pdf: new URL('/fonts/OpenSans/OpenSans.otf', import.meta.url).href,
        bold: new URL('/fonts/OpenSans/OpenSans-SemiBold.otf', import.meta.url).href,
        italic: new URL('/fonts/OpenSans/OpenSans-Italic.otf', import.meta.url).href,
        boldItalic: new URL('/fonts/OpenSans/OpenSans-SemiBoldItalic.otf', import.meta.url).href,
        viewport: 'Open Sans',
    },
    'Ubuntu': {
        url: 'https://fonts.googleapis.com/css2?family=Ubuntu&display=swap',
        pdf: '/fonts/Ubuntu/Ubuntu.otf',
        bold: '/fonts/Ubuntu/Ubuntu-SemiBold.otf',
        italic: '/fonts/Ubuntu/Ubuntu-Italic.otf',
        boldItalic: '/fonts/Ubuntu/Ubuntu-SemiBoldItalic.otf',
        viewport: 'Ubuntu',
    },
    'Noto Sans Mono': {
        url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Mono&display=swap',
        pdf: '/fonts/NotoSansMono/NotoSansMono.otf',
        bold: '/fonts/NotoSansMono/NotoSansMono-SemiBold.otf',
        viewport: 'Noto Sans Mono',
    },
    'Gloria Hallelujah': {
        url: 'https://fonts.googleapis.com/css2?family=Gloria+Hallelujah&display=swap',
        pdf: '/fonts/GloriaHallelujah.otf',
        viewport: 'Gloria Hallelujah'
    },
    'Bebas neue': {
        url: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
        pdf: '/fonts/BebasNeue.otf',
        viewport: 'Bebas neue'
    },
    'Emoji': {
        url: '/fonts/OpenMoji.woff',
        pdf: '/fonts/OpenMoji.otf',
        viewport: 'Emoji',
        hidden: true
    }
}

export async function loadFonts() {
    Object.keys(FontsAvailable).forEach(e => {
        if (!FontsAvailable[e].url) return;
        if (FontsAvailable[e].url.match(/\.woff/)) {
            LoadFont(e, FontsAvailable[e].url);
            return;
        }
        fetch(FontsAvailable[e].url).then(res => res.text().then(str => {
            const fontUrlRegex = /https:\/\/fonts.gstatic.com\/s\/.*\.woff2/gm
            for (const url of str.matchAll(fontUrlRegex)) {
                LoadFont(e, url);
            }
        }));
    })
}

function LoadFont(e: string, url: RegExpMatchArray | string) {
    const font = new FontFace(FontsAvailable[e].viewport, `url(${url})`);
    font.load().then((res: any) => {
        (document as any).fonts.add(res);
    }).catch((err: any) => console.log(err));
}

export async function EmbedFont(pdf: PDFdocument | null, font: string, fontStyle: 'normal' | 'bold' | 'italic' | 'boldItalic' = 'normal') {
    if (!pdf || !pdf.modifyRef) {
        console.log('Document not yet initialized');
        return;
    }
    if (!(font in FontsAvailable)) {
        console.log('Trying to embed unavailable font');
        return;
    }
    if (!FontsAvailable[font].pdf || Object.keys(pdf.embeddedResources).includes(font + fontStyle)) {
        console.log(`font ${font + fontStyle} is already embedded`);
        return;
    }
    const fontbytes = await fetch(getURL(font, fontStyle)).then(res => {
        return res.arrayBuffer()
    })
    pdf.embeddedResources[font + fontStyle] = await pdf.modifyRef.embedFont(fontbytes);
}

function getURL(fontName: string, style: 'normal' | 'bold' | 'italic' | 'boldItalic') {
    let ret;
    switch (style) {
        case 'bold':
            ret = FontsAvailable[fontName].bold;
            break;
        case 'boldItalic':
            ret = FontsAvailable[fontName].boldItalic;
            break;
        case 'italic':
            ret = FontsAvailable[fontName].italic;
            break;
        default:
            ret = FontsAvailable[fontName].pdf;
            break;
    }
    return ret || '';
}