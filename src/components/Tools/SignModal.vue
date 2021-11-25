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
        <canvas :id="'canvas_' + signature.id" class="w-100 h-100"></canvas>
        <div
          v-if="
            signature.hover &&
            signature.canvas &&
            !signature.canvas.isDrawingMode
          "
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
          <div class="d-flex flex-column">
            <div class="btn-group">
              <button class="btn btn-primary" @click="edit(signature.id)">
                <span class="material-icons">edit</span>
              </button>
              <button class="btn btn-danger" @click="remove(signature.id)">
                <span class="material-icons"> delete </span>
              </button>
            </div>
          </div>
          <div class="position-absolute w-100" style="bottom: 0">
            <input
              type="text"
              class="w-100 form-control"
              placeholder="Meno podpisu"
              v-model="signature.name"
            />
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
import type { ITemplate } from "@/@types";
import { Database } from "@/Db";
import Component from "vue-class-component";

const SignModalProps = Vue.extend({
  props: ["signs"],
});

@Component({})
export default class SignModal extends SignModalProps {
  signatures!: {
    hover: boolean;
    canvas?: fabric.Canvas;
    element?: HTMLCanvasElement;
    id: string;
    name?: string;
  }[];
  deleted: any;
  data() {
    return {
      signatures: [],
      canvases: [],
      deleted: [],
    };
  }
  mounted() {
    this.signs().then((signs: ITemplate[]) => {
      console.log(signs);
      this.signatures = signs.map((sign, i) => {
        return {
          hover: false,
          canvas: undefined,
          element: undefined,
          id: sign.id,
          name: sign.name || `Podpis ${i + 1}`,
        };
      });
      this.$nextTick().then(() => {
        if (signs.length > 0) {
          for (const sign of signs) {
            const cnv = document.getElementById(
              "canvas_" + sign.id
            ) as HTMLCanvasElement;
            const fabricCanvas = new fabric.Canvas(cnv, { selection: false });
            fabricCanvas.loadFromJSON(sign.data, () => {
              fabricCanvas.isDrawingMode = false;
            });
            const signature = this.signatures.find((e: any) => e.id == sign.id);
            if (signature) {
              signature.canvas = fabricCanvas;
              signature.element = cnv;
            }
          }
        }
        console.log(this.signatures);
      });
    });
  }
  addSignature() {
    const id = Math.random().toString(36).substr(2, 9);
    this.signatures.push({
      id: id,
      hover: false,
    });
    this.$nextTick().then(() => {
      const cnv = document.getElementById("canvas_" + id) as HTMLCanvasElement;

      console.log(cnv);

      const fabricCanvas = new fabric.Canvas(cnv, { selection: false });
      fabricCanvas.isDrawingMode = false;
      fabricCanvas.on("object:added", (e) => {
        if (!e.target) return;
        e.target.selectable = false;
        e.target.evented = false;
      });
      this.signatures[this.signatures.length - 1].canvas = fabricCanvas;
      this.signatures[this.signatures.length - 1].element = cnv;
    });
  }
  edit(id: number) {
    const cnv = this.signatures.find((e: any) => e.id == id);

    if (!cnv) return;
    this.signatures.forEach((e: any) => {
      e.canvas.isDrawingMode = false;
    });
    cnv.hover = false;
    if (cnv.canvas) cnv.canvas.isDrawingMode = true;
  }
  deselectAll() {
    if (!this.signatures.some((e: any) => e.hover)) {
      this.signatures.forEach((e: any) => {
        e.canvas.isDrawingMode = false;
      });
    }
  }
  remove(id: number) {
    const index = this.signatures.findIndex((e: any) => e.id == id);
    this.signatures.splice(index, 1);
    this.deleted.push(id);
  }
  signModalAccepted() {
    this.signatures.forEach((e: any) => {
      const data = {
        id: e.id || Math.random().toString(36).substr(2, 9),
        type: "Sign",
        data: e.canvas.toJSON(),
        name: e.name,
      };
      Database.updateTemplate(data as ITemplate);
    });
    this.deleted.forEach((e: string) => {
      Database.removetemplate(e);
    });
  }
}
</script>