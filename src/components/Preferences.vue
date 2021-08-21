<template>
  <b-row>
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
    <b-col cols="8">
      <h1 class="text-center">{{ selectedCategory.text }}</h1>
      <hr />
      <div v-if="selectedCategory.name == 'tools'">
        <b-row class="m-2">
          <b-col>Prvy selectnuty nastroj</b-col>
          <b-col>
            <b-select
              :options="selectedCategory.settings.defaultTool.options"
              v-model.number="selectedCategory.settings.defaultTool.value"
            >
            </b-select>
          </b-col>
        </b-row>
        <h2 class="text-center">Defaultne nastavenia pre nastroje</h2>
        <b-card
          v-for="tool in selectedCategory.settings.tools"
          :key="tool.name"
          :no-body="!tool.expanded"
        >
          <template #header class="p-0">
            <div class="w-100 h-100" @click="tool.expanded = !tool.expanded">
              {{ tool.name }}
            </div>
          </template>
          <transition name="slide">
            <b-card-body v-if="tool.expanded">
              <b-row v-if="tool.options.hasText">
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
              <b-row class="form-inline" v-if="tool.options.hasText">
                <b-col align-self="center"> Velkost Pisma </b-col>
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
              <b-row v-if="tool.options.hasStrokeWidth">
                <b-col align-self="center">Hrubka ciary</b-col>
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
              <b-row v-if="tool.options.hasStroke">
                <b-col align-self="center">Farba ciary</b-col>
                <b-col align-self="center">
                  <v-swatches
                    class="float-right"
                    v-model="tool.defaultOptions.fill"
                  ></v-swatches>
                </b-col>
              </b-row>
              <b-row v-if="tool.options.hasFill">
                <b-col align-self="center">Hrubka ciary</b-col>
                <b-col align-self="center">
                  <v-swatches
                    class="float-right"
                    v-model="tool.defaultOptions.stroke"
                  ></v-swatches>
                </b-col>
              </b-row>
            </b-card-body>
          </transition>
        </b-card>
      </div>
      <div v-else-if="selectedCategory.name == 'themes'">
        <b-row>
          <b-col align-self="center"
            >Ukazat preview rieseni v lavej liste</b-col
          >
          <b-col align-self="center">
            <b-form-checkbox
              size="md"
              v-model="selectedCategory.settings.showPreviews"
              switch
            ></b-form-checkbox>
          </b-col>
        </b-row>
        <hr />
        <h3 class="text-center">Moje farby</h3>
        <p>Tu si mozes vybrat farby ktore budes vsade pouzivat</p>
        <input type="color" class="colorInput" />
      </div>
    </b-col>
  </b-row>
</template>

<script lang="ts">
import Vue from "vue";
import { tools } from "./Tools/Tool";
import { FontsAvailable } from "./Fonts";
const VSwatches = require("vue-swatches");
export default Vue.extend({
  components: {
    VSwatches,
  },
  data() {
    const toolsCopy = tools.map((e) => {
      return {
        options: e.options,
        defaultOptions: e.defaultOptions,
        name: e.name,
        expanded: false,
      };
    });
    const categories = [
      {
        text: "Nastroje",
        settings: {
          defaultTool: {
            options: [
              { value: 0, text: "Text" },
              { value: 1, text: "Kreslit" },
              { value: 3, text: "Sipka (ciara)" },
              { value: 5, text: "Obdlznik" },
              { value: 6, text: "Podpis" },
              { value: 7, text: "Vybrat objekty" },
            ],
            value: 0,
          },
          tools: toolsCopy,
        },
        name: "tools",
      },
      {
        text: "Vzhlad",
        settings: {
          showPreviews: true,
        },
        name: "themes",
      },
    ];
    return {
      categories: categories,
      selectedCategoryIndex: 0,
      selectedCategory: categories[0],
      fonts: FontsAvailable,
    };
  },
  mounted() {},
  methods: {
    select(i: number) {
      this.selectedCategoryIndex = i;
      this.selectedCategory = this.categories[this.selectedCategoryIndex];
    },
  },
});
</script>

<style scoped>
.colorInput {
  opacity: 0;
}
.colorInput::before {
  display: block;
  background: red;
  border-radius: 50%;
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
</style>