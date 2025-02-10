<template>
  <div class="container">
    <div class="card start-hero">
      <p class="text-body-2 start-hero-intro">
        Woohoo!
      </p>
      <p class="text-display-2">
        Your authentication is all sorted.
        <br>
        Build the important stuff.
      </p>
      <p>
        Logged in user permissions: {{ permissions }}
      </p>
    </div>

    <section class="next-steps-section">
      <h2 class="text-heading-1">
        Next steps for you
      </h2>
    </section>
  </div>
</template>

<script setup lang="ts">
const client = useKindeClient()

const { data: permissions } = await useAsyncData(async () => {
  const { permissions } = await client?.getPermissions() ?? {}
  return permissions
})
</script>
