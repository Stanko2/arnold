<template>
  <div class="tags">
    <div class="position-relative">
      <h4 class="btn btn-warning" @click="ukazMenu = !ukazMenu">
        Kategorie
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
            >Upravit kategorie</b-button
          >
        </div>
      </transition>
      <tag-edit-modal ref="tagModal" />
    </div>
  </div>
</template>

<script lang="ts">
import { Database } from "@/Db";
import { Document } from "@/DocumentManager";
import Color from "color";
import Vue from "vue";
import TagEditModal from "./TagEditModal.vue";

export default Vue.extend({
  components: {
    TagEditModal,
  },
  mounted() {
    this.$data.availableTags = JSON.parse(localStorage.getItem("tags") || "[]");
    this.eventHub.$on(
      "tags:update",
      (tags: any[]) => (this.$data.availableTags = tags)
    );
    this.eventHub.$on(
      "editor:documentChanged",
      (pdf: any, document: Document) => {
        this.$data.doc = document;
        const tagy = this.availableTags.map((e: any) => e.id);
        let i = 0;
        while (i < document.tags.length) {
          const tag = document.tags[i];
          if (tagy.find((e) => e == tag) == undefined) {
            document.tags.splice(i, 1);
          } else i++;
        }
        Database.updateDocument(document.id, document, false);
      }
    );
  },
  data() {
    return {
      ukazMenu: false,
      availableTags: [],
      doc: undefined,
    };
  },
  methods: {
    zistiTagy(doc: Document) {
      this.$data.doc = doc;
    },
    getContrastColor(color: string) {
      const c = new Color(color);
      return c.isDark() ? "#ffffff" : "#000000";
    },
    toggleDocumentTag(tag: string) {
      const a = this.$data.doc.tags.findIndex((e: string) => e == tag);
      if (a != -1) {
        this.$data.doc.tags.splice(a, 1);
      } else {
        this.$data.doc.tags.push(tag);
      }
      this.$data.doc.tags.sort();
      Database.updateDocument(this.$data.doc.id, this.$data.doc);
      this.eventHub.$emit(
        "tags:documentTag",
        this.$data.doc.id,
        this.$data.doc.tags.map((e: any) =>
          this.$data.availableTags.find((f: { id: any }) => f.id == e)
        )
      );
    },
  },
});
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
  transform: rotate(-90deg) translate(-60%, 0);
  transform-origin: bottom left;
  height: 48px;
  border-radius: 10px 10px 0 0;
  top: 0;
  left: 0;
  margin-bottom: 0;
  padding-right: 28px;
}
.tags .tagy_okno {
  width: 200px;
  padding: 15px;
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