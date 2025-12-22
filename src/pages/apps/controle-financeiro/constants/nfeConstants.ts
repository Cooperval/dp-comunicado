/**
 * Constantes para upload e processamento de NFe
 */

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const MAX_FILES_UPLOAD = 20;
export const ALLOWED_EXTENSIONS = ['.xml'];

export const NFE_UPLOAD_MESSAGES = {
  INVALID_FORMAT: 'Por favor, selecione apenas arquivos XML',
  FILE_TOO_LARGE: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE_MB}MB`,
  UPLOAD_SUCCESS: 'NFe processada com sucesso!',
  UPLOAD_ERROR: 'Erro ao processar NFe',
  DELETE_SUCCESS: 'NFe excluída com sucesso',
  DELETE_ERROR: 'Erro ao excluir NFe',
  LOAD_ERROR: 'Erro ao carregar lista de NFes',
} as const;
