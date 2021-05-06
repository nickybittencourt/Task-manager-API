import express from 'express'
import multer from 'multer'
import sharp from "sharp"
import { User } from '../models/user.js'
import { auth } from '../middleware/auth.js'
import { sendWelcomeEmail, sendCancelEmail } from '../emails/account.js'
const router = new express.Router()

router.post('/', async (req, res) => {

    const user = new User(req.body)

    try {

        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })

    } catch (error) {
        console.log(error)
        res.status(400).send(error)
    }
})

router.post('/login', async (req, res) => {

    const email = req.body.email
    const password = req.body.password

    try {

        const user = await User.findByCredentials(email, password)
        const token = await user.generateAuthToken()
        res.send({ user, token })

    } catch (error) {

        res.status(400).send()
    }
})

router.post('/logout', auth, async (req, res) => {

    try {

        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)
        await req.user.save()
        res.send()

    } catch (error) {

        res.status(500).send()
    }
})

router.post('/logoutAll', auth, async (req, res) => {

    try {

        req.user.tokens = []
        await req.user.save()
        res.send()

    } catch (error) {

        res.status(500).send()
    }
})

router.get('/me', auth, async (req, res) => {

    res.send(req.user)
})

router.patch('/me', auth, async (req, res) => {

    const allowedUpdateFields = ['name', 'email', 'password', 'age']
    const updates = Object.keys(req.body)
    const isValidUpdate = updates.length != 0 && updates.every((field) => allowedUpdateFields.includes(field))

    if (!isValidUpdate) return res.status(400).send({ error: "Invalid update" })

    try {

        updates.forEach(update => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)

    } catch (error) {

        res.status(400).send(error)
    }
})

router.delete('/me', auth, async (req, res) => {

    try {

        await req.user.remove()
        sendCancelEmail(req.user.email, req.user.name)
        res.send(req.user)

    } catch (error) {

        console.log(error)
        res.status(500).send()
    }
})

const upload = multer({
    limits: { fileSize: 1000000 },
    fileFilter(req, file, cb) {

        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) return cb(new Error('Please upload an image!'))
        cb(undefined, true)
    }
})

router.post('/me/avatar', auth, upload.single('avatar'), async (req, res) => {

    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()

}, (error, req, res, next) => {

    res.status(400).send({ error: error.message })
})

router.delete('/me/avatar', auth, async (req, res) => {

    try {

        req.user.avatar = undefined
        await req.user.save()
        res.send()

    } catch (error) {

        res.status(500).send()
    }
})

router.get('/:id/avatar', async (req, res) => {

    const _id = req.params.id

    try {

        const user = await User.findById(_id)

        if (!user || !user.avatar) throw new Error()

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)

    } catch (error) {

        res.status(404).send()
    }
})

export { router }