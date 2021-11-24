import { StandardFonts } from 'pdf-lib';
import { PDFdocument } from './PDFdocument';
declare let FontFace: any;


export const FontsAvailable: Record<string, any> = {
    'Open Sans': {
        url: 'https://fonts.googleapis.com/css2?family=Open+Sans&display=swap',
        pdf: '/fonts/OpenSans.otf',
        viewport: 'Open Sans',
    },
    'Ubuntu': {
        url: 'https://fonts.googleapis.com/css2?family=Ubuntu&display=swap',
        pdf: '/fonts/Ubuntu.otf',
        viewport: 'Ubuntu',
    },
    'Noto Sans Mono': {
        url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Mono&display=swap',
        pdf: '/fonts/NotoSansMono.otf',
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
    // 'Emoji': {
    //     url: '/fonts/OpenMoji.woff',
    //     pdf: '/fonts/OpenMoji.otf',
    //     viewport: 'Emoji'
    // }
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

export async function EmbedFont(pdf: PDFdocument | null, font: string) {
    if (!pdf || !pdf.modifyRef) {
        console.log('Document not yet initialized');
        return;
    }
    if (!(font in FontsAvailable)) {
        console.log('Trying to embed unavailable font');
        return;
    }
    if (!FontsAvailable[font].pdf || Object.keys(pdf.embeddedResources).includes(font)) {
        console.log(`font ${font} is already embedded`);
        return;
    }
    const fontbytes = await fetch(FontsAvailable[font].pdf).then(res => {
        return res.arrayBuffer()
    })
    pdf.embeddedResources[font] = await pdf.modifyRef.embedFont(fontbytes);
}