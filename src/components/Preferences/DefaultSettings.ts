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
                        "fill": "#3398DBff"
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
                        "strokeWidth": 3
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
                        "stroke": "#3398DBff",
                        "strokeWidth": 10,
                        "fill": "#A463BFff"
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
                        "strokeWidth": 9
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
            },
            {
                "name": "copy",
                "shortcut": "ctrl+c"
            },
            {
                "name": "cut",
                "shortcut": "ctrl+x"
            },
            {
                "name": "paste",
                "shortcut": "ctrl+v"
            }
        ],
        "name": "shortcut"
    },
    "other": {
        "text": "Ostatne",
        "settings": {
            "showPreviews": true,
            "autoSave": true,
            "showTimer": false
        },
        "name": "other"
    }
}