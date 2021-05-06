import express from 'express'
import mongoose from 'mongoose';
import { Task } from '../models/task.js'
import { auth } from '../middleware/auth.js'


const ObjectId = mongoose.Types.ObjectId
const router = new express.Router()

router.post('/', auth, async (req, res) => {

    //const task = new Task(req.body)
    const task = new Task({ ...req.body, author: req.user._id })
    try {

        await task.save()
        res.status(201).send(task)

    } catch (error) {

        res.status(400).send(error)
    }
})

//GET /tasks?completed=true
//GET /tasks?limit=10&page=1
//GET /tasks?sortBy=createdAt:desc
router.get('/', auth, async (req, res) => {

    const search = { author: req.user._id }
    const options = { limit: 10, skip: 0 }
    const sort = {}

    if (req.query.completed) search.completed = req.query.completed === 'true'
    if (req.query.limit) options.limit = parseInt(req.query.limit)
    if (req.query.page) options.skip = parseInt(req.query.limit) * (parseInt(req.query.page) - 1)
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
    options.sort = sort

    try {

        const tasks = await Task.find(search, null, options)
        res.send(tasks)

    } catch (error) {

        res.status(500).send()
    }
})

router.get('/:id', auth, async (req, res) => {

    const _id = req.params.id

    if (!ObjectId.isValid(_id)) return res.status(400).send({ error: "Incorrect format for an ID" })

    try {

        const task = await Task.findOne({ _id, author: req.user._id })
        if (!task) return res.status(404).send()
        res.send(task)

    } catch (error) {

        res.status(500).send()
    }
})

router.patch('/:id', auth, async (req, res) => {

    const allowedUpdateFields = ['description', 'completed']
    const _id = req.params.id
    const updates = Object.keys(req.body)
    const isValidUpdate = updates.length != 0 && updates.every((field) => allowedUpdateFields.includes(field))

    if (!ObjectId.isValid(_id)) return res.status(400).send({ error: "Incorrect format for an ID" })
    if (!isValidUpdate) return res.status(400).send({ error: "Invalid update" })

    try {

        const task = await Task.findOne({ _id, author: req.user._id })
        if (!task) return res.status(404).send()
        updates.forEach(update => task[update] = req.body[update])
        await task.save()
        res.send(task)

    } catch (error) {

        res.status(400).send(error)
    }
})

router.delete('/:id', auth, async (req, res) => {

    const _id = req.params.id

    if (!ObjectId.isValid(_id)) return res.status(400).send({ error: "Incorrect format for an ID" })

    try {

        const task = await Task.findOneAndDelete({ _id, author: req.user._id })
        if (!task) return res.status(404).send()
        res.send(task)

    } catch (error) {

        res.status(500).send()
    }
})

export { router }