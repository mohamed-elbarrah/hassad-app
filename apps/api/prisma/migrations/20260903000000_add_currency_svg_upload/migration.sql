-- Keep uploaded SVGs distinct from external SVG URLs.
ALTER TYPE "SymbolType" ADD VALUE IF NOT EXISTS 'SVG_UPLOAD';
