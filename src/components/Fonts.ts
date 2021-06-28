import { StandardFonts } from 'pdf-lib';
const FontFaceObserver = require('fontfaceobserver');

export const FontsAvailable = {
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
    'Comic Sans': {
        pdf: '',
        viewport: 'Comic Sans'
    },
    'roboto': {
        pdf: '',
        viewport: 'Roboto'
    }
}

// export function loadFonts() {
//     Object.entries(FontsAvailable).forEach(e => {
//         const font = new FontFaceObserver((e as any).viewport);
//         font.load().then(() => console.log(e + ' loaded'));
//     });
// }