import prisma from '../src/lib/prisma'
import { createRequire } from 'node:module'

type DialogueSeedData = {
  CHARACTERS: readonly unknown[]
  STORY_DIALOGUES: Record<string, Record<number, string | string[]>>
}

const requireWithExtensions = createRequire(import.meta.url) as NodeJS.Require & {
  extensions: Record<string, (module: NodeJS.Module, filename: string) => void>
}

requireWithExtensions.extensions['.png'] = (module, filename) => {
  ;(module as NodeJS.Module & { exports: unknown }).exports = filename
}

async function loadDialogueSeedData(): Promise<DialogueSeedData> {
  const [{ CHARACTERS }, { STORY_DIALOGUES }] = await Promise.all([
    import('../../mobile/cosmo-miner/src/game/CHARACTERS'),
    import('../../mobile/cosmo-miner/src/game/STORY_DIALOGUES')
  ])

  return { CHARACTERS, STORY_DIALOGUES }
}

async function main() {
  const { CHARACTERS, STORY_DIALOGUES } = await loadDialogueSeedData()

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
