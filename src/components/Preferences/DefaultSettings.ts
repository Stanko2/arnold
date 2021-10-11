import { Settings } from "@/@types";

export default <Settings>{
    "tools": {
        "text": "Nastroje",
        "settings": {
            "defaultTool": {
                "options": [
                    {
                        "value": 0,
                        "text": "Text"
                    },
                    {
                        "value": 1,
                        "text": "Kreslit"
                    },
                    {
                        "value": 3,
                        "text": "Sipka"
                    },
                    {
                        "value": 5,
                        "text": "Obdlznik"
                    },
                    {
                        "value": 6,
                        "text": "Podpis"
                    },
                    {
                        "value": 7,
                        "text": "Vybrat objekty"
                    }
                ],
                "value": 7
            },
            "tools": [
                {
                    "options": {
                        "hasFill": true,
                        "hasStroke": false,
                        "hasText": true,
                        "hasStrokeWidth": false
                    },
                    "defaultOptions": {
                        "fontFamily": "Helvetica",
                        "fontSize": 15,
                        "fill": "#3398DBff",
                        "top": 520.0611601513241,
                        "left": 90.59583858764186
                    },
                    "name": "Text",
                    "expanded": false,
                    "shortcut": "q"
                },
                {
                    "options": {
                        "hasFill": false,
                        "hasStroke": true,
                        "hasStrokeWidth": true,
                        "hasText": false
                    },
                    "defaultOptions": {
                        "stroke": "#A463BFff",
                        "strokeWidth": 12
                    },
                    "name": "Draw",
                    "expanded": false,
                    "shortcut": "w"
                },
                {
                    "options": {
                        "hasFill": false,
                        "hasStroke": false,
                        "hasText": false,
                        "hasStrokeWidth": false
                    },
                    "name": "Photo",
                    "expanded": false,
                    "shortcut": "e"
                },
                {
                    "options": {
                        "hasFill": false,
                        "hasStroke": true,
                        "hasStrokeWidth": true,
                        "hasText": false
                    },
                    "defaultOptions": {
                        "stroke": "#F2C511ff",
                        "strokeWidth": 3,
                        "top": 159.81562302963428,
                        "left": 39.563896989281204,
                        "x1": 39.563896989281204,
                        "y1": 159.81562302963428,
                        "x2": 94.36452750630515,
                        "y2": 117.02608961223201,
                        "hasControls": true,
                        "hasBorders": false,
                        "strokeLineCap": "round",
                        "cornerSize": 20,
                        "cornerStyle": "circle",
                        "cornerColor": "blue",
                        "originX": "left",
                        "originY": "top",
                        "lockMovementX": true,
                        "lockMovementY": true,
                        "selectable": false
                    },
                    "name": "Arrow",
                    "expanded": false,
                    "shortcut": "r"
                },
                {
                    "options": {
                        "hasFill": true,
                        "hasStroke": true,
                        "hasText": false,
                        "hasStrokeWidth": true
                    },
                    "defaultOptions": {
                        "width": 30,
                        "height": 30,
                        "stroke": "#3398DBff",
                        "strokeWidth": 10,
                        "fill": "#A463BFff",
                        "top": 61.08984375,
                        "left": 95.625
                    },
                    "name": "Circle",
                    "expanded": false,
                    "shortcut": "t"
                },
                {
                    "options": {
                        "hasFill": true,
                        "hasStroke": true,
                        "hasStrokeWidth": true,
                        "hasText": false
                    },
                    "defaultOptions": {
                        "width": 30,
                        "height": 30,
                        "stroke": "#222F3Dff",
                        "fill": "#1CA085ff",
                        "strokeWidth": 13
                    },
                    "name": "Rect",
                    "expanded": false,
                    "shortcut": "y"
                },
                {
                    "options": {
                        "hasFill": false,
                        "hasStroke": true,
                        "hasText": false,
                        "hasStrokeWidth": true
                    },
                    "defaultOptions": {
                        "stroke": "#2ECC70ff",
                        "strokeWidth": 9,
                        "top": 30.691172761664568,
                        "left": 146.1378310214376,
                        "sign": "wfs0v71oa"
                    },
                    "name": "Sign",
                    "expanded": false,
                    "shortcut": "u"
                },
                {
                    "options": {
                        "hasFill": false,
                        "hasStroke": false,
                        "hasStrokeWidth": false,
                        "hasText": false
                    },
                    "defaultOptions": {},
                    "name": "Select",
                    "expanded": false,
                    "shortcut": "i"
                },
                {
                    "options": {
                        "hasFill": true,
                        "hasStroke": false,
                        "hasText": true,
                        "hasStrokeWidth": false
                    },
                    "defaultOptions": {
                        "fontFamily": "Gloria Hallelujah",
                        "fill": "#1CA085ff",
                        "fontSize": 50
                    },
                    "name": "scoring",
                    "expanded": true,
                    "shortcut": "b"
                }
            ]
        },
        "name": "tools"
    },
    "shortcut": {
        "text": "Klavesove skratky",
        "settings": [
            {
                "name": "Text",
                "shortcut": "q"
            },
            {
                "name": "Draw",
                "shortcut": "w"
            },
            {
                "name": "Photo",
                "shortcut": "e"
            },
            {
                "name": "Arrow",
                "shortcut": "r"
            },
            {
                "name": "Circle",
                "shortcut": "t"
            },
            {
                "name": "Rect",
                "shortcut": "y"
            },
            {
                "name": "Sign",
                "shortcut": "u"
            },
            {
                "name": "Select",
                "shortcut": "i"
            },
            {
                "name": "scoring",
                "shortcut": "b"
            },
            {
                "name": "selectNext",
                "shortcut": "ctrl+arrowdown"
            },
            {
                "name": "selectPrev",
                "shortcut": "ctrl+arrowup"
            },
            {
                "name": "save",
                "shortcut": "ctrl+s"
            },
            {
                "name": "delete",
                "shortcut": "del"
            },
            {
                "name": "zoomIn",
                "shortcut": "ctrl+plus"
            },
            {
                "name": "zoomOut",
                "shortcut": "ctrl+-"
            }
        ],
        "name": "shortcut"
    },
    "other": {
        "text": "Ostatne",
        "settings": {
            "showPreviews": false,
            "autoSave": true,
            "showTimer": false
        },
        "name": "other"
    }
}