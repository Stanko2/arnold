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

      <router-link
        :disabled="!hasFile"
        tag="button"
        class="text btn btn-primary btn-lg btn-block"
        to="/edit/0"
        >Zacat opravovat</router-link
      >
    </div>
    <div v-if="hasDocuments === true">
      <router-link
        tag="button"
        class="text btn btn-primary btn-lg btn-block"
        to="/edit/0"
        >Pokracovat v opravovani {{ problem }}</router-link
      >
    </div>
  </div>
</template>

<script lang="ts">
import { Database } from "@/Db";
import Vue from "vue";
import { loadFromDatabase } from "../DocumentManager";

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
    };
  },
  mounted() {
    return new Promise<void>((resolve, reject) => {
      Database.getAllDocuments().then((docs) => {
        this.$data.hasDocuments = docs.length > 0;
        this.problem = localStorage.getItem("uloha") || "";
      });
    });
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
          .catch((err) => reject(err))
          .then(() => {
            this.$router
              .push({
                name: "Editor",
                params: {
                  doc: "0",
                },
              })
              .then(() => resolve);
          });
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