// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig:{
    emailUser: process.env.EMAIL_USER,
    emailPass: process.env.EMAIL_PASS,
    jwtSecret: process.env.JWT_SECRET,
    mongoUrl: process.env.MONGO_URL,
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true }
})
