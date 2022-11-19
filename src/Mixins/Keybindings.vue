<template>
  <div>
    <div
      v-for="action in actionMap"
      :key="action.name"
      v-shortkey.once="getActionKeys(action.shortcut)"
      @shortkey="invokeAction(action.name)"
    />
  </div>
</template>

<script lang="ts">
import { Settings, Shortcut } from "@/@types";
import { State } from "@/Store";
import { Vue, Component, Prop, Watch } from "vue-property-decorator";


// Adding More Shortcuts:
// 1. add entry to defaulsettings.ts like this:
// {"name": "myShortcut", "shortcut": "ctrl+x"}
// 2. provide your shortcut description into this nameMap
// 3. you can use your shortcut like this:
//   this.eventhub.$on('shortcut:myShortcut', myFunction)
export const nameMap: Record<string, string> = {
  "Text": "Text",
  "Draw": "Kreslenie",
  "Photo": "Obrázok",
  "Arrow": "Šípka",
  "Circle": "Elipsa",
  "Rect": "Obdĺžnik",
  "Sign": "Podpis",
  "Select": "Vybrať objekty",
  "scoring": "Ukázať bodovanie",
  "selectNext": "Prepnúť sa na nasledujúce riešenie",
  "selectPrev": "Prepnúť sa na predošlé riešenie",
  "save": "Uložiť",
  "delete": "Zmazať vybrané objekty",
  "zoomIn": "Priblížiť sa",
  "zoomOut": "Vzdialiť sa",
  "copy": "Kopírovať",
  "paste": "Vložiť",
  "cut": "Vystrihnúť",
}


@Component
export default class Shortcuts extends Vue {
  actionMap: Shortcut[] = [];
  mounted() {
    (this.$store.state as State).settings.shortcut.settings.forEach(s => {
      this.actionMap.push(s);
    });
    this.$store.subscribe((mutation) => {
      if (mutation.type == "applySettings") {
        const settings = mutation.payload as Settings;
        this.actionMap = settings.shortcut.settings;
      }
    });
  }

  invokeAction(action: string) {
    this.eventHub.$emit(`shortcut:${action}`);
  }

  getActionKeys(shortcut: string): string[] {
    return shortcut.split("+").map((e) => (e === "plus" ? "+" : e));
  }
}
</script>

<style>
</style>