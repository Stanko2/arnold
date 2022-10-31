<template>
  <div class="tags">
    <div class="position-relative">
      <h4 class="btn btn-warning" @click="ukazMenu = !ukazMenu">
        Tagy
        <span class="material-icons d-inline position-absolute">{{
          ukazMenu ? "expand_more" : "expand_less"
        }}</span>
      </h4>
      <transition name="slide">
        <div v-if="ukazMenu" class="tagy_okno bg-warning">
          <div class="d-flex flex-wrap" v-if="doc">
            <h6
              v-for="tag in availableTags"
              :key="tag.id"
              class="m-1"
              @click="toggleDocumentTag(tag.id)"
            >
              <b-badge
                size="lg"
                :style="{
                  transition: 'all 250ms linear',
                  background: tag.color,
                  color: getContrastColor(tag.color),
                  opacity:
                    doc.tags.findIndex((e) => e == tag.id) == -1 ? 0.5 : 1,
                }"
              >
                {{ tag.meno }}
              </b-badge>
            </h6>
          </div>
          <b-button
            class="m-2 d-block"
            variant="secondary"
            @click="$bvModal.show('tag-modal')"
            size="sm"
            >Upraviť tagy</b-button
          >
        </div>
      </transition>
      <tag-edit-modal ref="tagModal" />
    </div>
  </div>
</template>

<script lang="ts">
import { Database } from "@/Db";
import { Document, Tag } from "@/@types";
import Color from "color";
import Vue from "vue";
import TagEditModal from "./TagEditModal.vue";
import Component from "vue-class-component";

@Component({
  components: {
    TagEditModal,
  },
})
export default class Tags extends Vue {
  availableTags: Tag[] = [];
  doc: Document | undefined;
  ukazMenu = false;
  mounted() {
    this.availableTags = JSON.parse(localStorage.getItem("tags") || "[]");
    this.eventHub.$on(
      "tags:update",
      (tags: Tag[]) => {
        this.$data.availableTags = tags;
        this.$forceUpdate();
      }
    );
    this.eventHub.$on(
      "editor:documentChanged",
      (pdf: any, document: Document) => {
        this.doc = document;
        const tagy = this.availableTags.map((e: any) => e.id);
        let i = 0;
        while (i < document.tags.length) {
          const tag = document.tags[i];
          if (tagy.find((e) => e == tag) == undefined) {
            document.tags.splice(i, 1);
          } else i++;
        }
        Database.updateDocument(document.id, document, false);
        this.$forceUpdate();
      }
    );
  }
  zistiTagy(doc: Document) {
    this.$data.doc = doc;
  }
  getContrastColor(color: string) {
    const c = new Color(color);
    return c.isDark() ? "#ffffff" : "#000000";
  }
  toggleDocumentTag(tag: string) {
    if (!this.doc) return;
    const a = this.doc.tags.findIndex((e: string) => e == tag);
    if (a != -1) {
      this.doc.tags.splice(a, 1);
    } else {
      this.doc.tags.push(tag);
    }
    this.doc.tags.sort();
    Database.updateDocument(this.doc.id, this.doc);
    this.eventHub.$emit("visibilityUpdate", this.doc);
    this.eventHub.$emit(
      "tags:documentTag",
      this.doc.id,
      this.doc.tags.map((e: any) =>
        this.availableTags.find((f: { id: any }) => f.id == e)
      )
    );
  }
}
</script>

<style scoped>
.tags {
  position: fixed;
  right: 0;
  top: 60%;
  color: whitesmoke;
  border-radius: 0 25px;
  transition: all 0.3s;
}

.tags h4 {
  position: absolute;
  transform: rotate(-90deg) translate(-3rem, 0);
  transform-origin: bottom left;
  height: 48px;
  border-radius: 10px 10px 0 0;
  top: 0;
  left: 0;
  margin-bottom: 0;
  padding-right: 28px;
  z-index: 1;
}
.tags .tagy_okno {
  width: 200px;
  padding: 15px;
  z-index: 2;
  box-shadow: 0 0 20px rgb(0 0 0 / 30%);
  border-radius: 10px 0 0 10px;
  min-height: 120px;
}

h6 {
  cursor: pointer;
  user-select: none;
}
/* .slide-leave-active,
.slide-enter-active {
  transition: 1s;
}
.slide-enter {
  transform: translate(100%, 0);
}
.slide-leave-to {
  transform: translate(100%, 0);
} */
</style>