<template>
  <b-modal size="lg" id="tag-modal" title="Upravit kategorie" @ok="tagUpdate">
    <b-list-group>
      <b-list-group-item
        pill
        v-for="(tag, i) in availableTags"
        :key="tag.id"
        class="d-flex flex-row align-items-center justify-content-between"
        :style="{ background: lighten(tag.color) }"
      >
        <b-input-group class="mr-3 d-flex align-items-center">
          <b-form-input
            class="w-75 tag-edit"
            type="text"
            v-model="tag.meno"
            placeholder="Zadaj meno kategorie"
            :style="{ color: getContrastColor(tag.color) }"
          />
          <b-input-group-append>
            <v-swatches v-model="tag.color" />
          </b-input-group-append>
        </b-input-group>
        <b-btn-close @click="removeTag(i)"></b-btn-close>
      </b-list-group-item>
    </b-list-group>
    <b-button block @click="addTag()">Pridat novu kategoriu</b-button>
  </b-modal>
</template>

<script lang="ts">
import { Tag } from "@/@types";
import Color from "color";
import Vue from "vue";
import Component from "vue-class-component";
const VSwatches = require("vue-swatches");

@Component({
  components: {
    VSwatches,
  },
})
export default class TagEditModal extends Vue {
  availableTags: Tag[] = [];
  mounted() {
    this.eventHub.$emit(
      "tags:update",
      JSON.parse(localStorage.getItem("tags") || "[]")
    );
  }
  data() {
    return {
      availableTags: JSON.parse(localStorage.getItem("tags") || "[]"),
    };
  }
  removeTag(i: number) {
    this.availableTags.splice(i, 1);
  }
  addTag() {
    this.availableTags.push({
      id: Math.random().toString(36).substr(2, 9),
      meno: "",
      color: "blue",
    });
  }
  lighten(color: string) {
    const c = new Color(color);
    return c.lighten(0.5).hex();
  }
  getContrastColor(color: string) {
    const c = new Color(color);
    return c.isDark() ? "#ffffff" : "#000000";
  }
  tagUpdate() {
    localStorage.setItem("tags", JSON.stringify(this.availableTags));
    this.eventHub.$emit("tags:update", this.availableTags);
  }
}
</script>

<style scoped>
.tag-edit {
  background: transparent;
  border: none;
}
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
}
</style>