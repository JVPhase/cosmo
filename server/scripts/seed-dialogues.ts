import prisma from '../src/lib/prisma'
import { CHARACTERS } from '../../mobile/cosmo-miner/src/game/CHARACTERS'
import { STORY_DIALOGUES } from '../../mobile/cosmo-miner/src/game/STORY_DIALOGUES'

async function main() {
  const data = {
    version: 1,
    characters: CHARACTERS,
    sectorDialogues: STORY_DIALOGUES
  }

  const existing = await prisma.gameConfig.findUnique({ where: { key: 'dialogues' } })
  const version = (existing?.version ?? 0) + 1

  await prisma.gameConfig.upsert({
    where: { key: 'dialogues' },
    create: { key: 'dialogues', data, version },
    update: { data, version }
  })

  // eslint-disable-next-line no-console
  console.log(`[seed-dialogues] upserted dialogues v${version}`)
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
