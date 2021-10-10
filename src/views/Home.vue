<template>
  <div class="container">
    <b-jumbotron
      bg-variant="success"
      text-variant="white"
      border-variant="dark"
    >
      <template #header>Vitaj v Arnoldovi</template>

      <template #lead>
        Arnold je jednoduchá aplikácia na pomoc pri opravovaní riešení v
        korešpodenčných seminároch Pikomat a Pikofyz.
      </template>

      <hr class="my-4" />

      <p>
        <strong>Chceš opravovať?</strong>
        Stiahni zip s riešeniami z interných, vlož ho sem a môžme sa do toho
        hneď pustiť 😎.
      </p>
    </b-jumbotron>
    <label for="mainInput" class="inputWrapper"> </label>
    <div v-if="hasDocuments === false">
      <p>{{ fileName }}</p>
      <b-form-file
        v-model="fileInput"
        accept=".zip"
        id="mainInput"
        size="lg"
        placeholder="Vloz zip, v ktorom su vsetky riesenia"
        @input="fileAdded"
      />
      <b-list-group v-if="fileInput">
        <b-list-group-item variant="primary">
          Obsah {{ fileName }}
        </b-list-group-item>
        <b-list-group-item v-for="(category, i) in categories" :key="category">
          <div>
            <div>{{ category }}</div>
            <div>{{ categoryCount[i] }}</div>
          </div>
        </b-list-group-item>
      </b-list-group>
      <b-button
        :disabled="!hasFile"
        block
        size="lg"
        variant="primary"
        class="text"
        @click="openEditor()"
        >Zacat pravovat {{ problem }}</b-button
      >
    </div>
    <div v-if="hasDocuments === true">
      <b-button
        size="lg"
        block
        variant="primary"
        class="text"
        @click="openEditor()"
        >Pokracovat v opravovani {{ problem }}</b-button
      >
    </div>
  </div>
</template>

<script lang="ts">
import { Database } from "@/Db";
import Vue from "vue";
import { loadFromDatabase } from "../DocumentManager";
import { Document, DocumentParser } from "@/@types";

export default Vue.extend({
  name: "Home",
  components: {},
  data() {
    return {
      fileName: "Vloz Zip s PDFkami na opravovanie",
      hasFile: false,
      fileInput: null,
      hasDocuments: null,
      problem: "",
      categories: Array<string>(),
      categoryCount: Array<number>(),
    };
  },
  mounted() {
    Database.getAllDocuments().then((docs) => {
      this.$data.hasDocuments = docs.length > 0;
      this.problem = localStorage.getItem("uloha") || "";
    });
    this.eventHub.$on(
      "contentParsed",
      (docs: Document[], parser: DocumentParser) => {
        this.categories = parser.kategorie;
        this.problem = parser.uloha;
        for (let i = 0; i < parser.kategorie.length; i++) {
          const category = parser.kategorie[i];
          this.categoryCount.push(
            docs.filter((e) => e.kategoria == category).length
          );
        }
      }
    );
  },
  methods: {
    fileAdded: function () {
      var file = this.fileInput;
      if (file != null) {
        this.eventHub.$emit("editor:parseDocuments", file);
        this.fileName = file["name"];
        this.hasFile = true;
      }
    },
    openEditor: function () {
      return new Promise<void>((resolve, reject) => {
        loadFromDatabase()
          .then((docs) => {
            this.$router
              .push({
                name: "Editor",
                params: {
                  doc: docs[0].id.toString(),
                },
              })
              .then(() => resolve);
          })
          .catch((err) => reject(err));
      });
    },
  },
});
</script>

scrip

<style>
.text {
  color: black;
}
img {
  margin: 0 auto;
}
input[type="file"] {
  display: none;
}
/* .inputWrapper {
  width: 100%;
  height: 30vh;
  background: rgba(128, 128, 128, 0.336);
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.inputWrapper p {
  color: rgb(83, 81, 81);
} */
</style>