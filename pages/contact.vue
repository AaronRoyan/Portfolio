<script>
import feather from "feather-icons";

export default {
  scrollToTop: true,
  data: () => {
    return {
      contacts: [
        {
          id: 1,
          name: "India",
          icon: "map-pin",
        },
        {
          id: 2,
          name: "royanjason@gmail.com",
          icon: "mail",
        },
        {
          id: 3,
          name: "+91 99020 39107",
          icon: "phone",
        },
      ],
    };
  },
  mounted() {
    feather.replace();
  },
  updated() {
    feather.replace();
  },
};
</script>

<template>
  <div
    class="
      container
      mx-auto
      flex flex-col-reverse
      md:flex-row md:py-10 md:mt-20
    "
  >
    <ContactForm />

    <ContactDetails :contacts="contacts" />
  </div>
</template>
