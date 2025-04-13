import { createRouter ,defineEventHandler } from 'h3'
import blog from './blog'
import auth from './auth'

const router = createRouter();

router.use("/blog",blog);
router.use("/auth",auth)

export default defineEventHandler((event)=>{
    return router.handler(event)
})