// Prints, per module, the words of the section 8.1 shadowing text that the
// learner has not met yet. Usage (from the repo root):
//   npx tsx scripts/check-dialogue-vocab.ts            # MOD-002..MOD-005
//   npx tsx scripts/check-dialogue-vocab.ts MOD-003    # one module
// Exit code 1 when any module has exceptions. The same rule runs in `npm test`.
import path from 'node:path';
import { VaultReader } from '../backend/src/vault/reader';
import { checkDialogueVocab } from '../backend/tests/helpers/dialogueVocab';

const modules = process.argv.length > 2 ? process.argv.slice(2) : ['MOD-002', 'MOD-003', 'MOD-004', 'MOD-005'];

(async () => {
  const reader = new VaultReader({ vault_path: path.resolve(__dirname, '../curriculum'), watch: false });
  await reader.start();
  let failed = false;
  for (const id of modules) {
    const r = checkDialogueVocab(reader, id);
    console.log(`${id}: ${r.blocks} block(s), ${r.words} words`);
    console.log(`  exceptions : ${r.exceptions.join(', ') || '(none)'}`);
    console.log(`  taught forms used : ${r.taughtForms.join(', ') || '(none)'}`);
    console.log(`  names used : ${r.names.join(', ') || '(none)'}`);
    if (r.exceptions.length > 0) failed = true;
  }
  await reader.stop();
  process.exit(failed ? 1 : 0);
})();
