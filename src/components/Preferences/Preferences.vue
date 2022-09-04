<template>
  <b-row class="window">
    <b-col cols="4">
      <b-list-group>
        <b-list-group-item
          v-for="(category, i) in categories"
          :key="category.name"
          @click="select(i)"
          :class="{ active: selectedCategoryIndex == i }"
          >{{ category.text }}</b-list-group-item
        >
      </b-list-group>
    </b-col>
    <b-col cols="8" class="categoryMenu">
      <h1 class="text-center">{{ selectedCategory.text }}</h1>
      <hr>
      <div v-if="selectedCategory.name == 'tools'">
        <b-row class="setting">
          <b-col>Prvý selectnutý nástroj</b-col>
          <b-col>
            <b-select
              :options="selectedCategory.settings.defaultTool.options"
              v-model="selectedCategory.settings.defaultTool.value"
            >
            </b-select>
          </b-col>
        </b-row>
        <hr>
        <h2 class="text-center m-2">
          Defaultné nastavenia pre jednotlivé nástroje
        </h2>
        <b-card
          v-for="tool in selectedCategory.settings.tools.filter((e) =>
            hasSettings(e)
          )"
          :key="tool.name"
          :no-body="!tool.expanded"
        >
          <template #header class="p-0">
            <div class="w-100 h-100" @click="tool.expanded = !tool.expanded">
              {{ shortcutNameMap[tool.name] }}
            </div>
          </template>
          <transition name="slide">
            <div v-if="tool.expanded">
              <b-row v-if="tool.options.hasText" class="setting">
                <b-col align-self="center"> Font </b-col>
                <b-col align-self="center">
                  <b-dropdown
                    :text="tool.defaultOptions.fontFamily"
                    class="float-right"
                  >
                    <b-dropdown-item
                      v-for="font in fonts"
                      :key="font.viewport"
                      :style="{ 'font-family': font.viewport }"
                      @click.native="
                        tool.defaultOptions.fontFamily = font.viewport
                      "
                      >{{ font.viewport }}</b-dropdown-item
                    >
                  </b-dropdown>
                </b-col>
              </b-row>
              <b-row v-if="tool.options.hasText" class="setting">
                <b-col align-self="center"> Veľkosť Písma </b-col>
                <b-col align-self="center">
                  <input
                    class="form-control float-right"
                    min="0"
                    style="width: 100px"
                    type="number"
                    v-model.number="tool.defaultOptions.fontSize"
                  />
                </b-col>
              </b-row>
              <b-row v-if="tool.options.hasStrokeWidth" class="setting">
                <b-col align-self="center">Hrúbka čiary</b-col>
                <b-col align-self="center">
                  <div class="float-right">
                    <input
                      class=""
                      min="1"
                      style="width: 100px"
                      type="range"
                      max="20"
                      v-model.number="tool.defaultOptions.strokeWidth"
                    />
                    {{ tool.defaultOptions.strokeWidth }}
                  </div>
                </b-col>
              </b-row>

              <b-row v-if="tool.options.hasStroke" class="setting">
                <b-col align-self="center">Farba čiary</b-col>
                <b-col align-self="center">
                  <color-picker
                    class="float-right"
                    v-model="tool.defaultOptions.stroke"
                    :value="tool.defaultOptions.stroke"
                    :name="tool.name + 'stroke'"
                  />
                </b-col>
              </b-row>
              <b-row v-if="tool.options.hasFill" class="setting">
                <b-col align-self="center">Výplň</b-col>
                <b-col align-self="center">
                  <color-picker
                    class="float-right"
                    v-model="tool.defaultOptions.fill"
                    :value="tool.defaultOptions.fill"
                    :name="tool.name + 'fill'"
                  />
                </b-col>
              </b-row>
            </div>
          </transition>
        </b-card>
      </div>
      <div v-else-if="selectedCategory.name == 'other'">
        <b-row>
          <b-col>Ukázať preview riešení v ľavej lište</b-col>
          <b-col>
            <b-form-checkbox
              class="float-right"
              size="md"
              v-model="selectedCategory.settings.showPreviews"
              switch
            ></b-form-checkbox>
          </b-col>
        </b-row>
        <hr>
        <b-row>
          <b-col>Auto-save riešenia pri prepnutí</b-col>
          <b-col>
            <b-form-checkbox
              class="float-right"
              size="md"
              v-model="selectedCategory.settings.autoSave"
              switch
            ></b-form-checkbox>
          </b-col>
        </b-row>
        <hr>
        <b-row>
          <b-col>Ukázať časovač</b-col>
          <b-col>
            <b-form-checkbox
              class="float-right"
              size="md"
              v-model="selectedCategory.settings.showTimer"
              switch
            ></b-form-checkbox>
          </b-col>
        </b-row>
        <hr>
        <b-row>
          <b-col>Téma</b-col>
          <b-col>
            <b-dropdown
              class="float-right"
              size="md"
              :text="selectedCategory.settings.theme"
              right
            >
              <b-dropdown-item @click="selectedCategory.settings.theme = 'light'">Svetlé</b-dropdown-item>
              <b-dropdown-item @click="selectedCategory.settings.theme = 'dark'">Tmavé</b-dropdown-item>
              <b-dropdown-item @click="selectedCategory.settings.theme = 'system'">Podľa systému</b-dropdown-item>
            </b-dropdown>
          </b-col>
        </b-row>
      </div>
      <div v-else-if="selectedCategory.name == 'shortcut'">
        <b-alert show variant="info" dismissible
          >Chceš vedieť ako nastaviť svoje skratky? klikni
          <a @click="$refs.shortcutHelp.show()" class="link-primary">sem</a>
          <shortcut-help-modal ref="shortcutHelp" />
        </b-alert>
        <div v-for="tool in selectedCategory.settings" :key="tool.name">
          <b-row>
            <b-col align-self="center">{{ shortcutNameMap[tool.name] }}</b-col>
            <b-col align-self="center">
              <b-form-input
                class="float-right w-50"
                v-model="tool.shortcut"
              ></b-form-input>
            </b-col>
          </b-row>
          <hr>
        </div>
      </div>
    </b-col>
  </b-row>
</template>

<script lang="ts">
import Vue from "vue";
import { tools } from "../Tools/Tool";
import { FontsAvailable } from "../Fonts";
import ColorPicker from "../ColorPicker.vue";
import Component from "vue-class-component";
import ShortcutHelpModal from "./ShortcutHelpModal.vue";
import {
  OthersCategory,
  SettingsCategory,
  ShortcutCategory,
  ToolsCategory,
} from "@/@types";
import { Settings } from "@/@types/Preferences";
import { nameMap } from "@/Mixins/Keybindings.vue"

@Component({
  components: {
    ColorPicker,
    ShortcutHelpModal,
  },
})
export default class Preferences extends Vue {
  categories: SettingsCategory[] = [];
  selectedCategoryIndex!: number;
  selectedCategory!: SettingsCategory;
  shortcutNameMap = nameMap;
  fonts = FontsAvailable;
  $refs!: {
    shortcutHelp: ShortcutHelpModal;
  };
  beforeMount() {
    const toolsCopy = [
      ...tools.map((e) => {
        return {
          options: e.options,
          defaultOptions: e.defaultOptions,
          name: e.name,
          expanded: false,
          shortcut: e.shortcut,
        };
      }),
      {
        options: {
          hasFill: true,
          hasStroke: false,
          hasText: true,
          hasStrokeWidth: false,
        },
        defaultOptions: {
          fontFamily: "Helvetica",
          fill: "#000000",
          fontSize: 12,
        },
        name: "scoring",
        expanded: false,
        shortcut: "b",
      },
    ];
    this.categories = [
      {
        text: "Nástroje",
        settings: {
          defaultTool: {
            options: [
              { value: 0, text: "Text" },
              { value: 1, text: "Kreslit" },
              { value: 3, text: "Sipka" },
              { value: 5, text: "Obdlznik" },
              { value: 6, text: "Podpis" },
              { value: 7, text: "Vybrat objekty" },
            ],
            value: 0,
          },
          tools: toolsCopy,
        },
        name: "tools",
      } as ToolsCategory,
      {
        text: "Klavesové skratky",
        settings: [
          ...toolsCopy.map((e) => {
            return { name: e.name, shortcut: e.shortcut };
          }),
          { name: "selectNext", shortcut: "ctrl+arrowdown" },
          { name: "selectPrev", shortcut: "ctrl+arrowup" },
          { name: "save", shortcut: "ctrl+s" },
          { name: "delete", shortcut: "del" },
          { name: "zoomIn", shortcut: "ctrl+plus" },
          { name: "zoomOut", shortcut: "ctrl+-" },
          { name: "cut", shortcut: "ctrl+x" },
          { name: "copy", shortcut: "ctrl+c" },
          { name: "paste", shortcut: "ctrl+v" },
        ],
        name: "shortcut",
      } as ShortcutCategory,
      {
        text: "Ostatné",
        settings: {
          showPreviews: true,
          autoSave: true,
          showTimer: false,
          theme: 'system',
        },
        name: "other",
      } as OthersCategory,
    ];
    this.selectedCategoryIndex = 0;
    this.selectedCategory = this.categories[this.selectedCategoryIndex];
  } 
  mounted() {
    const data = localStorage.getItem("preferences");
    if (data) {
      const prefs: Settings = this.$store.state.settings;
      this.categories[0].settings.defaultTool.value =
        prefs.tools.settings.defaultTool.value;
      Object.assign(this.categories[2].settings, prefs.other.settings);
      Object.assign(this.categories[1].settings, prefs.shortcut.settings);
      
      this.categories[0].settings.tools[
        this.categories[0].settings.tools.length - 1
      ] = prefs.tools.settings.tools.find((e: any) => e.name == "scoring");
    }
  }
  select(i: number) {
    console.log(i);
    this.selectedCategoryIndex = i;
    this.selectedCategory = this.categories[this.selectedCategoryIndex];
    this.$forceUpdate();
  }
  hasSettings(tool: any): boolean {
    return Object.keys(tool.options).some((key) => tool.options[key]);
  }
  save() {
    localStorage.removeItem("preferences");
    const preferences: Record<string, any> = {};
    for (const category of this.categories) {
      preferences[category.name] = category;
    }
    localStorage.setItem("preferences", JSON.stringify(preferences));
    this.$store.commit("applySettings", preferences);
    this.eventHub.$emit("tools:init");
  }
}
</script>

<style scoped lang="scss">
.colorInput {
  opacity: 0;
  
  &::before {
    display: block;
    background: red;
    border-radius: 50%;
  }
}

.slide-leave-active,
.slide-enter-active {
  transition: 250ms ease-in-out;
}
.slide-enter {
  transform: translate(0, -100%);
}
.slide-leave-to {
  transform: translate(0, -100%);
}
.window {
  height: 75vh;
  max-height: 75vh;
}
.categoryMenu {
  width: 100%;
  height: 100%;
  overflow: auto;
  user-select: none;
}
.categoryMenu::-webkit-scrollbar {
  display: none;
}
.setting {
  margin-top: 5px;
  margin-bottom: 5px;
}
</style>