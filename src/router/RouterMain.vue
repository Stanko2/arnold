<template>
  <div class="wrapper">
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component
export default class Main extends Vue { }
</script>

<style>
.wrapper {
  padding: 0;
  margin: 0;
  height: 100vh;
  width: 100%;
  user-select: none;
  /* overflow: hidden; */
}

/* width */
::-webkit-scrollbar {
  width: 10px;
}

/* Track */
::-webkit-scrollbar-track {
  background: #f1f1f1;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 5px;
  transition: all 300ms linear;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>