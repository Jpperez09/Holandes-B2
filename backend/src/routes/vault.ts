import { Router, Request, Response } from 'express';
import { requireVault } from '../middleware/require-vault';
import {
  getIndexerState,
  getRawGrammarPatterns,
  getRawLevels,
  getRawModules,
  getRawSeedFiles,
  getRawVocabulary,
  getRawWarnings,
  runFullIndex,
} from '../services/vault-indexer';
import { getVaultPath } from '../services/settings-service';

const router = Router();

// GET /api/vault/snapshot — terse summary of indexer state
router.get('/snapshot', requireVault, (_req: Request, res: Response) => {
  const indexerState = getIndexerState();
  const seeds = getRawSeedFiles();
  res.json({
    indexerState,
    counts: {
      modules: getRawModules().length,
      levels: getRawLevels().length,
      vocabulary: getRawVocabulary().length,
      grammar_patterns: getRawGrammarPatterns().length,
      vocabulary_seed_files: seeds.vocabulary.length,
      grammar_registry_files: seeds.grammar.length,
      warnings: getRawWarnings().length,
    },
  });
});

// GET /api/vault/modules — diagnostic view of indexed modules
router.get('/modules', requireVault, (_req: Request, res: Response) => {
  res.json({ items: getRawModules(), indexerState: getIndexerState() });
});

// GET /api/vault/modules/:module_id — full parsed module incl. body
router.get('/modules/:module_id', requireVault, (req: Request, res: Response) => {
  const moduleId = req.params['module_id'];
  const module = getRawModules().find((m) => m.module_id === moduleId);
  if (!module) {
    return res.status(404).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Not Found',
      status: 404,
      detail: `Module not found in vault: ${moduleId}`,
    });
  }
  res.json(module);
});

// GET /api/vault/levels — diagnostic view of indexed levels
router.get('/levels', requireVault, (_req: Request, res: Response) => {
  res.json({ items: getRawLevels(), indexerState: getIndexerState() });
});

// GET /api/vault/vocabulary — parsed vocab seed rows
router.get('/vocabulary', requireVault, (_req: Request, res: Response) => {
  res.json({ items: getRawVocabulary(), indexerState: getIndexerState() });
});

// GET /api/vault/grammar-patterns — parsed grammar registry rows
router.get('/grammar-patterns', requireVault, (_req: Request, res: Response) => {
  res.json({ items: getRawGrammarPatterns(), indexerState: getIndexerState() });
});

// GET /api/vault/warnings — accumulated parser warnings
router.get('/warnings', requireVault, (_req: Request, res: Response) => {
  res.json({ warnings: getRawWarnings(), indexerState: getIndexerState() });
});

// POST /api/vault/reindex — force a full re-index
router.post('/reindex', requireVault, async (_req: Request, res: Response) => {
  const vaultPath = getVaultPath();
  const state = await runFullIndex(vaultPath, { watch: false });
  res.json({ ok: state.ready, indexerState: state, warnings: getRawWarnings() });
});

export default router;
