<script setup lang="ts">
import Main from "@/nav/components/main.vue"
import Top from "@/nav/components/top.vue";
import Footer from "@/nav/components/footer.vue";

</script>

<template>
  <div class="index">
    <top></top>
    <Main></Main>
<Footer></Footer>
  </div>

</template>

<style scoped>
*{
  margin: 0;
  padding: 0;
}
.index{
  width: 100%;
  height: 1000px;
}
</style>