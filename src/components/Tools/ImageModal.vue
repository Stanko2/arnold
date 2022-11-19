<template>
  <div class="d-flex flex-row flex-wrap justify-content-around">
    <b-file
      ref="imageInput"
      v-model="file"
      type="file"
      style="display: none"
      accept=".png"
      plain
      @input="addImage"
    />
    <div
      v-for="image in images"
      :key="image.id"
      class="card d-flex justify-content-center align-items-center btn"
      style="width: 300px; height: 150px"
      @mouseover="image.hover = true"
      @mouseleave="image.hover = false"
    >
      <div
        v-if="image.hover"
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
            <!-- <button class="btn btn-primary" @click="edit(image.id)">
              <span class="material-icons">edit</span>
            </button> -->
            <button
              class="btn btn-danger"
              @click="remove(image.id)"
            >
              <span class="material-icons"> delete </span>
            </button>
          </div>
        </div>
        <div
          class="position-absolute w-100"
          style="bottom: 0"
        >
          <input
            v-model="image.name"
            type="text"
            class="w-100 form-control"
            placeholder="Meno obrázku"
          >
        </div>
      </div>
      <b-img
        :src="image.data.img"
        class="mw-100 mh-100"
      />
    </div>
    <div
      class="card d-flex justify-content-center align-items-center btn"
      style="width: 300px; height: 150px"
      @click="openImageSelect"
    >
      <span class="material-icons">add</span>
    </div>
  </div>
</template>

<script lang="ts">
import { ITemplate } from "@/@types";
import { Database } from "@/Db";
import { BFormFile } from "bootstrap-vue";
import Vue from "vue";
import Component from "vue-class-component";

@Component
export default class ImageModal extends Vue {
  images: Array<ITemplate & { hover: boolean }> = [];
  file: File | undefined;

  $refs!: {
    imageInput: BFormFile;
  }
  deleted: string[] = [];

  mounted() {
    Database.getAllTemplates().then((templates) => {
      this.images = templates.filter(e => e.type === "Image").map(e => { return { ...e, hover: false } });
    })
  }

  openImageSelect() {
    (this.$refs.imageInput.$el as HTMLElement).click();
  }

  async addImage() {
    if (!this.file) return;
    const data = await this.getBase64(this.file);
    this.images.push({
      id: Math.random().toString(36).substr(2, 9),
      name: this.file.name.substring(0, this.file.name.length - 4),
      type: "Image",
      templateOptions: {},
      data: {
        img: data
      },
      hover: false
    })
    this.$nextTick();
  }

  getBase64(file: File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  imageModalAccepted() {
    this.images.forEach(e => {
      Database.updateTemplate(e);
    });
    this.deleted.forEach((e: string) => {
      Database.removetemplate(e);
    });
  }

  remove(id: string) {
    const img = this.images.findIndex(e => e.id == id);
    this.images.splice(img, 1);
    this.deleted.push(id);
  }
}
</script>