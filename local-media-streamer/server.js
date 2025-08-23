// AI generated

const express = require('express')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const HOST = '0.0.0.0'
const PORT = 3000

const app = express()

app.use(express.static(path.join(__dirname, 'public')))

// Helper: stream media with Range support
function streamFile(req, res, filePath, contentType) {
    const stat = fs.statSync(filePath)
    const fileSize = stat.size
    const range = req.headers.range

    if (!range) {
        res.writeHead(200, { 'Content-Length': fileSize, 'Content-Type': contentType })
        fs.createReadStream(filePath).pipe(res)
        return
    }

    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
    const chunkSize = end - start + 1

    const file = fs.createReadStream(filePath, { start, end })
    res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
    })
    file.pipe(res)
}

// Video/audio routes
app.get(/^\/audio\/(.+)/, (req, res) => {
    const relPath = decodeURIComponent(req.params[0])
    const filePath = path.join(__dirname, 'public/audio', relPath)
    streamFile(req, res, filePath, 'audio/mpeg')
})

app.get(/^\/video\/(.+)/, (req, res) => {
    const relPath = decodeURIComponent(req.params[0])
    const filePath = path.join(__dirname, 'public/video', relPath)
    streamFile(req, res, filePath, 'video/mp4')
})

function walkDir(dir, allowedExt) {
    let results = []
    fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
        const fullPath = path.join(dir, entry.name)
        try {
            const stats = fs.statSync(fullPath) // follows symlinks
            if (stats.isDirectory()) {
                results = results.concat(walkDir(fullPath, allowedExt))
            } else if (allowedExt.includes(path.extname(entry.name).toLowerCase())) {
                results.push(fullPath)
            }
        } catch (err) {
            console.warn(`Skipping ${fullPath}: ${err.message}`)
        }
    })
    return results
}

function getFileHash(filePath) {
    const data = fs.readFileSync(filePath)
    return crypto.createHash('sha1').update(data).digest('hex')
}

const allowedAudioExt = ['.mp3', '.wav', '.ogg', '.m4a']
const allowedVideoExt = ['.mp4', '.webm', '.mkv', '.mov']

// Return list of files as HTML links
app.get('/files', (req, res) => {
    const audioDir = path.join(__dirname, 'public/audio')
    const videoDir = path.join(__dirname, 'public/video')

    const audioFiles = walkDir(audioDir, allowedAudioExt)
        .map(filePath => {
            const relPath = path.relative(audioDir, filePath).replace(/\\/g, '/')
            const hash = getFileHash(filePath)
            return `<a href="#" class="file-link" data-type="audio" data-file="${relPath}" data-id="${hash}">${relPath}</a>`
        })

    const videoFiles = walkDir(videoDir, allowedVideoExt)
        .map(filePath => {
            const relPath = path.relative(videoDir, filePath).replace(/\\/g, '/')
            const hash = getFileHash(filePath)
            return `<a href="#" class="file-link" data-type="video" data-file="${relPath}" data-id="${hash}">${relPath}</a>`
        })

    res.send(`
    <h3>Audio</h3>${audioFiles.join('<br>') || 'No audio files found'}
    <h3>Video</h3>${videoFiles.join('<br>') || 'No video files found'}
  `)
})

app.listen(PORT, HOST, (e) => e ?
    console.error(e) :
    console.log(`Server running at http://${HOST}:${PORT}`)
)
