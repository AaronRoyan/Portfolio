<script>
import feather from "feather-icons";

export default {
  name: "About",
  scrollToTop: true,
  mounted() {
    feather.replace();
  },
  updated() {
    feather.replace();
  },
};
</script>

<template>
  <div>
    <AboutMe class="container mx-auto" />
    <AboutCounter />
  </div>
</template>

<style scoped></style>
