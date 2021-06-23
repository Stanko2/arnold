<template>
  <div
    class="d-flex flex-row flex-wrap justify-content-around"
    @mousedown="deselectAll"
  >
    <div v-for="signature in signatures" :key="signature.id">
      <div
        class="card position-relative"
        style="width: 300px; height: 150px"
        @mouseover="signature.hover = true"
        @mouseleave="signature.hover = false"
      >
        <canvas ref="signCanvas" class="w-100 h-100"></canvas>
        <div
          v-if="signature.hover && !signature.canvas.isDrawingMode"
          class="
            d-flex
            justify-content-center
            align-items-center
            position-absolute
            w-100
            h-100
          "
          style="background: rgb(0, 0, 0, 0.5)"
        >
          <div class="d-flex">
            <button class="btn btn-primary" @click="edit(signature.id)">
              <span class="material-icons">edit</span>
            </button>
            <button class="btn btn-danger" @click="remove(signature.id)">
              <span class="material-icons"> delete </span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div
      class="card d-flex justify-content-center align-items-center btn"
      style="width: 300px; height: 150px"
      @click="addSignature"
    >
      <span class="material-icons">add</span>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { fabric } from "fabric";
export default Vue.extend({
  data() {
    return {
      signatures: [],
    };
  },
  mounted() {
    for (var i = 0; i < (this.$refs.signCanvas as any[]).length; i++) {
      const cnv = (this.$refs.signCanvas as any[])[i];
      const fabricCanvas = new fabric.Canvas(cnv, { selection: false });
      fabricCanvas.isDrawingMode = false;
    }
  },
  methods: {
    addSignature() {
      const id = this.$data.signatures.push({
        id: this.$data.signatures.length,
        hover: false,
      });
      setTimeout(() => {
        const cnv = (this.$refs.signCanvas as any[])[id - 1];
        console.log(cnv);
        const fabricCanvas = new fabric.Canvas(cnv, { selection: false });
        fabricCanvas.isDrawingMode = false;
        fabricCanvas.on("object:added", (e) => {
          if (!e.target) return;
          e.target.selectable = false;
          e.target.evented = false;
        });
        this.$data.signatures[id - 1].canvas = fabricCanvas;
        this.$data.signatures[id - 1].element = cnv;
      }, 20);
    },
    edit(id: number) {
      const cnv = this.$data.signatures.find((e: any) => e.id == id);

      if (!cnv) return;
      this.$data.signatures.forEach((e: any) => {
        e.canvas.isDrawingMode = false;
      });
      cnv.canvas.isDrawingMode = true;
    },
    deselectAll() {
      if (!this.$data.signatures.some((e: any) => e.hover)) {
        this.$data.signatures.forEach((e: any) => {
          e.canvas.isDrawingMode = false;
        });
      }
    },
    remove(id: number) {
      this.$data.signatures.splice(id, 1);
      this.$data.signatures.forEach((e: any, index: number) => {
        e.id = index;
      });
    },
  },
});
</script>