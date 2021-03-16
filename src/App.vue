<template>
  <div id="app">
    <Viewport></Viewport>
  </div>
</template>

<script>
import Viewport from './components/Viewport.vue'
import { TextAnnotation } from './components/Annotation.ts'

var annotation = new TextAnnotation();
console.log(annotation);

export default {
  name: 'App',
  components: {
    Viewport
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
