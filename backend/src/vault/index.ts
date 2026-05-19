export {
  VaultReader,
  classifyVaultFile,
  toPosix,
  type VaultReaderOptions,
  type VaultEntry,
  type VaultFileKind,
  type VaultIndexSnapshot,
  type VaultLogger,
} from './reader';

export { parseModuleFile } from '../parsers/module';
export { parseLevelFile } from '../parsers/level';
export { parseVocabularySeed } from '../parsers/vocabulary';
export { parseGrammarRegistry } from '../parsers/grammar';

export type {
  ParsedActivity,
  ParsedFile,
  ParsedGrammarPattern,
  ParsedGrammarRegistry,
  ParsedLevel,
  ParsedModule,
  ParsedVocabItem,
  ParsedVocabularySeed,
  ActivityType,
  CefrBand,
  CefrLetter,
  ContentType,
  VocabPos,
} from '../types/content';

export type { ParserResult, ParserWarning, WarningSeverity } from '../types/parser';
