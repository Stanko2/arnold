import { StandardFonts } from 'pdf-lib';
import { PDFdocument } from './PDFdocument';
declare let FontFace: any;


export const FontsAvailable: Record<string, any> = {
    'Helvetica': {
        pdf: StandardFonts.Helvetica,
        viewport: 'Helvetica',
    },
    'Times New Roman': {
        pdf: StandardFonts.TimesRoman,
        viewport: 'Times New Roman',
    },
    'Courier New': {
        pdf: StandardFonts.Courier,
        viewport: 'Courier New',
    },
    // 'Roboto': {
    //     url: 'https://fonts.googleapis.com/css2?family=Roboto',
    //     pdf: '/fonts/Roboto.ttf',
    //     viewport: 'Roboto'
    // },
    // 'Bebas neue': {
    //     url: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
    //     pdf: '/fonts/Bebas-neue.ttf',
    //     viewport: 'Bebas neue'
    // }
}

export async function loadFonts() {
    Object.keys(FontsAvailable).forEach(e => {
        if (!FontsAvailable[e].url) return;
        fetch(FontsAvailable[e].url).then(res => res.text().then(str => {
            for (const url of str.matchAll(/https:\/\/fonts.gstatic.com\/s\/.*\.woff2/gm)) {
                const font = new FontFace(FontsAvailable[e].viewport, `url(${url})`);
                font.load().then((res: any) => {
                    (document as any).fonts.add(res);
                }).catch((err: any) => console.log(err));
            }
        }));
    })
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
        console.log(res);
        return res.arrayBuffer()
    })
    pdf.embeddedResources[font] = await pdf.modifyRef.embedFont(fontbytes);
}