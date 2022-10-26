<script>
export default {
  data: () => {
    return {
      // @todo
    };
  },
};
</script>

<template>
  <div class="mt-20 sm:mt-20  bg-primary-light dark:bg-ternary-dark shadow-sm   ">
    <div
      class="
        font-general-regular
        container
        mx-auto
        py-20
        block
        sm:flex sm:justify-center sm:items-center gap-96 
        text-center
      "
    >
      <div class="mb-20 sm:mb-0">
        <span
          class="
            font-general-medium
            text-4xl
            font-bold
            text-secondary-dark
            dark:text-secondary-light
            mb-2
          "
          ><img
            v-if="this.$colorMode.value == 'dark'"
            src="~/static/conti.svg"
            alt="Developer Dark"/>
        </span
        >
        <!-- <span class="block text-md text-ternary-dark dark:text-ternary-light"
          >1+</span
        > -->
      </div>
      
      <!-- <div class="mb-20 sm:mb-0">
        <span
          class="
            font-general-medium
            text-4xl
            font-bold
            text-secondary-dark
            dark:text-secondary-light
            mb-2
          "
          >21</span
        >
        <span class="block text-md text-ternary-dark dark:text-ternary-light"
          >Projetos concluídos</span
        >
      </div> -->
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
