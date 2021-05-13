import { StandardFonts } from 'pdf-lib'

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
    'Comic Sans':{
        pdf: '',
        viewport: 'Comic Sans MS'
    }
}