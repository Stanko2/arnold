<template>
  <b-modal
    id="tag-modal"
    size="lg"
    title="Upraviť tagy"
    @ok="tagUpdate"
  >
    <b-list-group>
      <b-list-group-item
        v-for="(tag, i) in availableTags"
        :key="tag.id"
        pill
        class="tag"
        :style="{ background: lighten(tag.color) }"
      >
        <b-input-group class="mr-3 d-flex align-items-center">
          <b-form-input
            v-model="tag.meno"
            class="w-75 tag-edit"
            type="text"
            placeholder="Zadaj meno"
            :style="{ color: getContrastColor(tag.color) }"
          />
        </b-input-group>
        <div class="tag-options">
          <color-picker
            v-model="tag.color"
            :name="'tagcolor' + i"
            :has-opacity="false"
            class="color-picker"
          />
          <button
            :disabled="i == 0"
            @click="move(i, false)"
          >
            expand_less
          </button>
          <button
            :disabled="i == availableTags.length - 1"
            @click="move(i, true)"
          >
            expand_more
          </button>
          <button @click="removeTag(i)">
            close
          </button>
        </div>
      </b-list-group-item>
    </b-list-group>
    <b-button
      block
      @click="addTag()"
    >
      Pridat novy Tag
    </b-button>
  </b-modal>
</template>

<script lang="ts">
import {Tag} from "@/@types";
import Color from "color";
import Vue from "vue";
import Component from "vue-class-component";
import ColorPicker from "../ColorPicker.vue";


@Component({
  components: {
    ColorPicker
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
    let id: string;
    do {
      id = Math.random().toString(36).substr(2, 9);
    } while (this.availableTags.find((tag) => tag.id == id));

    this.availableTags.push({
      id,
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
  move(index: number, up: boolean){
    const next = up ? index + 1 : index - 1;
    const temp = this.availableTags[index];
    this.availableTags[index] = this.availableTags[next];
    this.availableTags[next] = temp;
    this.$forceUpdate();
  }
}
</script>

<style scoped lang="scss">
.tag-edit {
  background: transparent;
  border: none;
  &:focus {
    background: transparent;
  }
}
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  appearance: none;
}
.tag{
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1;
  .tag-options{
    display: flex;
    align-items: center;
    .color-picker{
      height: 42px;
      transform: scale(0.85);
    }
    button{
      @apply material-icons;
      background: transparent;
      border: none;
      font-family: 'Material Icons';
    }
  }
}
</style>
