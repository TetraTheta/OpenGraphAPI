import { JSDOM } from "jsdom"

//export const runtime = process.env.NODE_ENV === 'production' ? 'edge' : 'node'
export const runtime = 'edge'

const cache = new Map<string, any>()

export async function GET(req: Request) {
  const allowedOrigin = ['http://localhost:44', 'https://tetralog.onrender.com']

  // 'Origin' is Forbidden Header Name, so it is immutable
  const origin = req.headers.get('origin')
  if (!origin || allowedOrigin.includes(origin)) {
    return new Response('Forbidden', { status: 403 })
  }

  const url = new URL(req.url).searchParams.get('url')
  if (!url) {
    return new Response('Bad Request', { status: 400 })
  }
  if (cache.has(url)) {
    return new Response(JSON.stringify(cache.get(url)), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Network response was not OK')
    }
    const text = await response.text()
    const doc = new JSDOM(text).window.document

    const getMetaContent = (names: string[]) => {
      for (const name of names) {
        const meta = doc.querySelector(`meta[name="${name}"]`) || doc.querySelector(`meta[property="${name}"]`)
        if (meta) {
          return meta.getAttribute('content') || ''
        }
      }
      return ''
    }

    const title = getMetaContent(['title', 'og:title', 'twitter:title'])
    const desc = getMetaContent(['description', 'og:description', 'twitter:description'])
    const image = getMetaContent(['image', 'og:image', 'twitter:image'])

    const ogData = {
      title,
      desc,
      image,
    }

    cache.set(url, ogData)

    return new Response(JSON.stringify(ogData), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response('Error fetching Open Graph data', { status: 500 });
  }
}
