<template>
  <div class="emoji">
    <div class="position-relative">
      <h4
        class="btn btn-success"
        @click="ukazMenu = !ukazMenu"
      >
        Komentare
        <span class="material-icons d-inline position-absolute">{{
          ukazMenu ? "expand_more" : "expand_less"
        }}</span>
      </h4>
      <transition name="slide">
        <div
          v-if="ukazMenu"
          class="emoji_okno bg-success"
        >
          <b-card
            v-for="template in data"
            :key="template.text"
          >
            <p
              :style="{
                color: template.color.hex(),
                'font-family': template.font,
              }"
            >
              {{ template.text }}
            </p>
          </b-card>
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import Color from "color";
import Vue from "vue";
import { FontsAvailable } from "../Fonts";
export default Vue.extend({
  data() {
    return {
      ukazMenu: false,
      comments: [
        "Ahoj , tvoje riesenie je super \n len tak dalej :)",
        "Mas to cele nahovno",
      ],
      data: Array<any>(),
    };
  },
  mounted() {
    const fonts = Object.keys(FontsAvailable);
    this.data = this.comments.map((e) => {
      return {
        text: e,
        font: fonts[Math.floor(Math.random() * fonts.length)],
        color: Color.rgb(
          Math.random() * 255,
          Math.random() * 255,
          Math.random() * 255
        ),
      };
    });
  },
});
</script>

<style scoped>
.emoji {
  z-index: 0;
  position: fixed;
  right: 0;
  top: 40%;
  color: whitesmoke;
  border-radius: 0 25px;
  transition: all 0.3s;
}

.emoji h4 {
  position: absolute;
  transform: rotate(-90deg) translate(-60%, 0);
  transform-origin: bottom left;
  height: 48px;
  border-radius: 10px 10px 0 0;
  top: 0;
  left: 0;
  margin-bottom: 0;
  padding-right: 28px;
}
.emoji .emoji_okno {
  width: 200px;
  padding: 15px;
  z-index: 30;
}

h6 {
  cursor: pointer;
  user-select: none;
}
</style>