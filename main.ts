import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import pMap from 'p-map'
import Debug from 'debug'
const debug = Debug('me*')
Debug.enable('me*')
process.env.PRISMA_CLIENT_GET_TIME = 'true'

async function main() {
  const client = new PrismaClient()

  const arr = new Array(1000 * 1000).fill(undefined)

  let count = 0
  debug(`Going for it...`)
  let lastTime = Date.now()
  const totalTimes: number[] = []
  const rustElapsedTimes: number[] = []
  let lastElapsed = 0
  await pMap(
    arr,
    async () => {
      const email = getId()
      const name = getId()
      const result = (await client.user.upsert({
        // data: {
        //   email: getId(),
        //   name: getId(),
        // },
        create: {
          email,
          name,
        },
        update: {
          email,
          name,
        },
        where: {
          email,
        },
      })) as any
      lastElapsed += result.elapsed
      count++
      if (count % 1000 === 0) {
        // first warm up
        if (count >= 1000) {
          totalTimes.push(Date.now() - lastTime)
          rustElapsedTimes.push(lastElapsed)
          debug(
            `Done with ${count}. We're at average of ${average(
              totalTimes,
            ).toFixed(2)}ms in total, ${average(rustElapsedTimes).toFixed(
              2,
            )}ms for Rust elapsed`,
          )
        }
        lastTime = Date.now()
        lastElapsed = 0
      }
    },
    {
      concurrency: 24,
    },
  )
  client.disconnect()
}

function getId() {
  return crypto.randomBytes(20).toString('hex')
}

main()

function average(n: number[]): number {
  return n.reduce((sum, curr) => sum + curr, 0) / n.length
}
