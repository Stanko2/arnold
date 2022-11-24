<template>
  <div>
    <h4 class="text-center mb-3">
      Bodovacie podpisy a obrázky
    </h4>
    <div class="card">
      <b-row class="border-bottom mr-1 ml-1">
        <b-col class="text-center p-2">
          <h6>Body</h6>
        </b-col>
        <b-col class="text-center p-2">
          <h6>Template</h6>
        </b-col>
      </b-row>
      <b-row 
        v-for="(entry, i) in scoreEntries" 
        :key="i"
        class="mr-1 ml-1 p-0"
      >
        <b-col class="border-right p-1">
          <b-form-input 
            v-model.number="entry.points" 
            type="number"
            min="0" 
            style="width: 60px"
            :state="isValid(i)"
          />
        </b-col>
        <b-col class="p-1 d-flex justify-content-between">
          <b-dropdown 
            right
            :text="entry.template.name"
          >
            <b-dropdown-item 
              v-for="template in templates" 
              :key="template.id"
              @click="entry.template = template"
            >
              {{ template.name }}
            </b-dropdown-item>
          </b-dropdown>
          <b-button 
            variant="danger" 
            @click="scoreEntries.splice(i,1)"
          >
            <span class="material-icons d-block">delete</span>
          </b-button>
        </b-col>
      </b-row>
      <b-button
        block
        @click="addEntry"
      >
        <span class="material-icons d-block">add</span>
      </b-button>
    </div>
  </div>
</template>

<script lang="ts">
import { ITemplate } from '@/@types';
import { Database } from '@/Db';
import Vue from 'vue'
import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';

interface ScoreEntry {
    points: number;
    template: ITemplate;
}

@Component
export default class ScoreTemplates extends Vue {
  templates: ITemplate[] = []
  scoreEntries: ScoreEntry[] = [];

  mounted(){
    Database.getAllTemplates().then(templates=> {
      this.templates = templates;
      this.load(this.$store.state.scoringEntries);
    });
  }

  @Watch('scoreEntries', {deep: true})
  save(){
    this.$store.commit('setScoringEntries', this.scoreEntries.map(e => {
      return {
        points: e.points,
        id: e.template.id
      }
    }))
  }

  load(data: {id: string, points: number}[]){
    for (const entry of data) {
      const template = this.templates.find(t=> t.id == entry.id);
      if(!template) continue;
      this.scoreEntries.push({
        points: entry.points, 
        template
      })
    }
  }

  addEntry(){
    this.scoreEntries.push({
      points: 0,
      template: this.templates[0]
    })
  }

  isValid(i: number){
    const ret = this.scoreEntries.every((e, idx)=> {
      if(idx == i) return true;
      return e.points != this.scoreEntries[i].points
    })
    return ret ? null : false
  }
}
</script>

<style>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  appearance: none;
  margin: 0;
}
</style>