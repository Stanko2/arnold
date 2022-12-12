import { ToolOptions } from "./Tools";

export interface SettingsCategory {
    text: string;
    name: string;
    settings: any;
}


export interface ToolsCategory extends SettingsCategory {
    settings: {
        defaultTool: {
            options: { value: number, text: string }[],
            value: number,
        },
        tools: ToolSettings[],
        colors: string[],
    }
}

export interface ToolSettings {
    options: ToolOptions;
    defaultOptions: fabric.IObjectOptions;
    name: string;
    expanded: boolean;
    shortcut: string;
}

export interface Settings {
    tools: ToolsCategory;
    other: OthersCategory;
    shortcut: ShortcutCategory;
}

export interface Shortcut {
    name: string;
    shortcut: string;
}

export interface ShortcutCategory extends SettingsCategory {
    settings: Shortcut[];
}

export interface OthersCategory extends SettingsCategory {
    settings: {
        showPreviews: boolean;
        autoSave: boolean;
        showTimer: boolean;
        theme: 'dark' | 'light' | 'system';
    }
}