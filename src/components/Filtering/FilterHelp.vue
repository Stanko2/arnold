
<template>
    <b-modal id="filterhelp" size="lg" ok-only>
        <h1>Filtrovanie</h1>
        <p>Filtrovať môžeš pomocou mena riešiteľa v hlavnom vyhľadávaní. 
            Potom sa dá filtrovať aj pomocou filtrovacích podmienok. Podmienky 
            vyzerajú takto:</p>
        <code>podmienka1(parameter1,parameter2) podmienka2()</code>
        <p>Podmienka sa dá vo všeobecnosti napísať ako je meno a potom
            do normálnych zátvoriek jej parametre, ktoré sú oddelené 
            čiarkami. Medzery sa môžu dávať, ale nemusia. Na poradí 
            podmienok nezáleží.
        </p>
        <p>Dané riešenie bude potom zobrazené práve vtedy keď spĺňa všetky zadané 
            podmienky. Ak by si chcel podmienku znegovať, tak pred ňu daj zreteľný 
        <strong>MÍNUS</strong></p>
        <h3>1. Podmienka - tagy</h3>
        <p>Vie zobrazovať riešenia na základe tagov</p>
        <p><code>tags(Tag1, Tag2)</code> -> Zobrazí riešenia, ktoré obsahujú "Tag1",
             alebo "Tag2".</p>
        <p><code>-tags(Tag1)</code> -> Zobrazí len tie riešenia, ktoré 
            <strong>neobsahujú</strong> "Tag1".</p>
        <h3>2. Podmienka - bodovanie</h3>
        <p>Filtruje riešenia na základe toho či a koľko majú bodov</p>
        <p><code>body()</code> -> Všetky riešenia, 
            ktoré už majú zadané nejaké body</p>
        <p><code>body(2,5)</code> -> Všetky riešenia, 
            ktoré majú aspoň 2 a najviac 5 bodov</p>
        <h3>3. Podmienka - otvorené</h3>
        <p><code>open()</code>-> zobrazí len už otvorené riešenia.</p>
        <h3>4. Podmienka - komentár</h3>
        <p><code>comment()</code>-> ukáže len riešenia s napísaným komentárom.</p>
        <h3>Tips & Tricks</h3>
        <p>Všetky neobodované riešenia s tagom "hlupáci" -> <code>tags(hlupáci) -body()</code></p>
        <p>Všetky nepozreté riešenia <code>-open()</code></p>
        <p>Neobodované už pozreté riešenia <code>-body() open()</code></p>
        <p></p>
    </b-modal>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component
export default class FilterHelp extends Vue{}
</script>

<style>
code {
    border: 1px solid var(--bg-700);
    border-radius: .2rem;
    padding: 4px;
}
</style>