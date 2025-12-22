
/* =========================================
 * Config
 * ========================================= */


const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');


/** Monta a URL final, respeitando o urlApi */
const url = (path: string) => `${urlApi}${path}`;

/* =========================================
 * Erro HTTP com status + corpo
 * ========================================= */
export class HttpError extends Error {
  status: number;
  body: any;
  constructor(status: number, message: string, body?: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/* =========================================
 * Helpers comuns (validação/conversão)
 * ========================================= */

/** Verifica se string está em formato ISO `YYYY-MM-DD` */
const isISODate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

/** Converte valor em número (erro se NaN) */
const toNumberStrict = (v: unknown, field: string): number => {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`${field} inválido`);
  return n;
};

/** Converte string numérica opcional: "" => null, senão Number (erro se NaN) */
const toOptionalNumber = (v: string | number | "" | null | undefined, field: string) => {
  if (v === "" || v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`${field} inválido`);
  return n;
};

/** Normaliza data opcional: ""/undefined => null; valida ISO quando presente */
const normalizeOptionalISODate = (s?: string | null) => {
  if (!s || s.trim() === "") return null;
  if (!isISODate(s)) throw new Error("data deve estar no formato YYYY-MM-DD");
  return s;
};

/* =========================================
 * Wrapper de fetch (JSON)
 * - Lança HttpError em caso de !ok
 * ========================================= */
async function fetchJSON<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const resp = await fetch(input, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  const data = await resp
    .json()
    .catch(() => ({})); // backend pode não retornar JSON em erros

  if (!resp.ok) {
    const msg = data?.error || data?.message || `HTTP ${resp.status}`;
    throw new HttpError(resp.status, msg, data);
  }
  return data as T;
}

/* =======================================================================================
 * TIPOS — Lançamentos futuros
 * =======================================================================================
 */
export type LancForm = {
  descricao: string;
  valor: string | number;
  tipo: "pagar" | "receber";
  cod_banco: string | number | "";
  cod_agencia: string | number | "";
  cod_contabancaria: string | number | "";
  digito: string | number | "";
  documento: string | number | "";
  data_sugerida?: string;   // YYYY-MM-DD | ""
  situacao: "pendente" | "realizado";
};

/* =========================================
 * CREATE — Lançamentos futuros
 * - Campos "tipo" e "situacao" mapeiam p/ 'P'/'R'
 * - cod_banco e cod_contabancaria são obrigatórios
 * ========================================= */
export async function enviarLancamento(form: LancForm, token?: string) {

  // validações mínimas
  const desc_movimento = String(form.descricao ?? "").trim();
  if (!desc_movimento) throw new Error("Descrição é obrigatória");

  const valor = toNumberStrict(form.valor, "Valor");
  if (valor <= 0) throw new Error("Valor deve ser maior que zero");

  const cod_documento = toOptionalNumber(form.documento, "Documento");
  // Conversões opcionais (supondo que toOptionalNumber retorna number | null)
  const cod_banco = toOptionalNumber(form.cod_banco, "Banco"); // number | null
  const cod_agencia = toOptionalNumber(form.cod_agencia, "Agência");
  const cod_contabancaria = toOptionalNumber(form.cod_contabancaria, "Conta bancária");

  // digito pode ser alfanumérico — trate como string opcional
  const digito = (form.digito === null || form.digito === undefined || form.digito === "")
    ? null
    : String(form.digito);

  // Removidas as validações que obrigavam banco/conta:
  // if (!cod_banco) throw new Error("Selecione o banco");
  // if (!cod_contabancaria) throw new Error("Selecione a conta bancária");

  const data_sugerida = normalizeOptionalISODate(form.data_sugerida);

  const payload = {
    desc_movimento,
    valor,
    documento: cod_documento,
    tipo: form.tipo === "pagar" ? "P" : "R",
    // envie explicitamente null quando ausente (evita enviar "" ou undefined)
    cod_banco: cod_banco == null ? null : cod_banco,
    cod_agencia: cod_agencia == null ? null : cod_agencia,
    cod_contabancaria: cod_contabancaria == null ? null : cod_contabancaria,
    digito: digito ?? null,
    data_sugerida,
    situacao: form.situacao === "realizado" ? "R" : "P",
  };

    const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetchJSON(
    url("/fluxo-caixa/adicionar-lancamento"),
    {
      method: "POST",
      body: JSON.stringify(payload),
      headers,
    }
  );
}

/* =========================================
 * UPDATE — Lançamentos futuros
 * - Mesmo payload do create (agora com valor corrigido)
 * ========================================= */
export async function atualizarLancamento(
  id: string | number,
  form: LancForm, token?: string
) {
  const desc_movimento = String(form.descricao ?? "").trim();
  if (!desc_movimento) throw new Error("Descrição é obrigatória");
  const cod_documento = toOptionalNumber(form.documento, "Documento");
  // faltava 'valor' — aqui garantimos a mesma validação do create
  const valor = toNumberStrict(form.valor, "Valor");
  if (valor <= 0) throw new Error("Valor deve ser maior que zero");

  const payload = {
    desc_movimento,
    valor,
    documento: cod_documento,
    tipo: form.tipo === "pagar" ? "P" : "R",
    cod_banco: (() => {
      const v = toOptionalNumber(form.cod_banco, "Banco");
      return v == null ? null : v;
    })(),
    cod_agencia: (() => {
      const v = toOptionalNumber(form.cod_agencia, "Agência");
      return v == null ? null : v;
    })(),
    cod_contabancaria: (() => {
      const v = toOptionalNumber(form.cod_contabancaria, "Conta bancária");
      return v == null ? null : v;
    })(),
    digito: (form.digito === null || form.digito === undefined || form.digito === "") ? null : String(form.digito),
    data_sugerida: normalizeOptionalISODate(form.data_sugerida),
    situacao: form.situacao === "realizado" ? "R" : "P",
  };

    const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetchJSON(
    url(`/fluxo-caixa/atualizar-lancamento/${id}`),
    { method: "PUT", body: JSON.stringify(payload), headers, }
  );
}


/* =========================================
 * DELETE — Lançamentos futuros
 * ========================================= */
export async function deletarLancamento(id: string | number, token?: string) {
  
  return fetchJSON(
    url(`/fluxo-caixa/excluir-lancamento/${id}`),
    { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : undefined, }
  );
}

/* =======================================================================================
 * TIPOS — Pendências (contas a pagar/receber vindas do legado)
 * =======================================================================================
 */
export type PendForm = {
  cod_grupoempresa: number | string;
  cod_tipocontaspagar: number | string;
  documento: number | string;
  parcela: number | string;
  data_sugerida: string | null; // YYYY-MM-DD | null (null apaga)
};

/* =========================================
 * CREATE — Pendência (insere na cscliente.fc_lancamentopendencias)
 * ========================================= */
export async function enviarPendencia(form: Omit<PendForm, "data_sugerida"> & { data_sugerida?: string | null }) {
  const payload = {
    cod_grupoempresa: toNumberStrict(form.cod_grupoempresa, "cod_grupoempresa"),
    cod_tipocontaspagar: toNumberStrict(form.cod_tipocontaspagar, "cod_tipocontaspagar"),
    documento: toNumberStrict(form.documento, "documento"),
    parcela: toNumberStrict(form.parcela, "parcela"),
    data_sugerida: normalizeOptionalISODate(form.data_sugerida ?? null),
  };

  return fetchJSON(
    url("/fluxo-caixa/adicionar-lancamento-pendencias"),
    { method: "POST", body: JSON.stringify(payload) }
  );
}

/* =========================================
 * UPDATE — Pendência (atualiza data_sugerida)
 * - Backend retorna 404 se não existir (usado no upsert)
 * ========================================= */
export async function atualizarPendencia(form: PendForm) {
  const payload = {
    cod_grupoempresa: toNumberStrict(form.cod_grupoempresa, "cod_grupoempresa"),
    cod_tipocontaspagar: toNumberStrict(form.cod_tipocontaspagar, "cod_tipocontaspagar"),
    documento: toNumberStrict(form.documento, "documento"),
    parcela: toNumberStrict(form.parcela, "parcela"),
    data_sugerida: normalizeOptionalISODate(form.data_sugerida),
  };


  return fetchJSON(
    url("/fluxo-caixa/atualizar-lancamento-pendencias"),
    { method: "PUT", body: JSON.stringify(payload) }
  );
}

/* =========================================
 * UPSERT — Pendência
 * - Tenta atualizar; se 404, cria.
 * - Mantém outras falhas (ex.: 400/409/500)
 * ========================================= */
export async function upsertPendencia(form: PendForm) {
  try {
    return await atualizarPendencia(form);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) {
      // não existia: cria
      return await enviarPendencia(form);
    }
    throw e;
  }
}




/* =========================================
 * POST - Envia saldo
 * ========================================= */
export async function enviarContaParaEdicao(form: {
  cod_banco: number;
  cod_agencia: number;
  cod_contabancaria: number;
  digito: string | number;
  cod_tipo: number | string;   // da UI
  motivo: string;
  saldo_antigo: number;
  novo_saldo: number;
  data?: string;               // YYYY-MM-DD (opcional)
}, token?: string) {
  const today = new Date().toISOString().slice(0, 10);

  const payload = {
    cod_banco: Number(form.cod_banco),
    cod_agencia: Number(form.cod_agencia),
    cod_contabancaria: Number(form.cod_contabancaria),
    cod_tipocontabancaria: Number(form.cod_tipo), // nome que o backend usa
    digito: String(form.digito),
    motivo: String(form.motivo ?? ""),
    saldo_antigo: Number(form.saldo_antigo),
    novo_saldo: Number(form.novo_saldo),
    data: /^\d{4}-\d{2}-\d{2}$/.test(form.data || "") ? form.data : today,
  };

  if ([payload.cod_banco, payload.cod_agencia, payload.cod_contabancaria, payload.cod_tipocontabancaria].some(Number.isNaN)) {
    throw new Error("Parâmetros inválidos (banco/agência/conta/tipo).");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const resp = await fetch(`${urlApi}/fluxo-caixa/adicionar-saldo`, { // garanta a base correta
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const text = await resp.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { }
  if (!resp.ok) throw new Error(json?.error || `HTTP ${resp.status}: ${text}`);
  return json;
}




/* =========================================
 * PUT - Atualiza saldo (NOVO_SALDO)
 * ========================================= */
export async function atualizarContaSaldo(form: {
  cod_banco: number;
  cod_agencia: number;
  cod_contabancaria: number;
  digito: string | number | null;
  cod_tipo: number | string;
  motivo: string;
  novo_saldo: number;
  data?: string; // YYYY-MM-DD
}, token?: string) {
  const today = new Date().toISOString().slice(0, 10);

  const payload = {
    cod_banco: Number(form.cod_banco),
    cod_agencia: Number(form.cod_agencia),
    cod_contabancaria: Number(form.cod_contabancaria),
    cod_tipocontabancaria: Number(form.cod_tipo),
    digito: form.digito == null ? null : String(form.digito),
    motivo: String(form.motivo ?? ""),
    novo_saldo: Number(form.novo_saldo),
    data: /^\d{4}-\d{2}-\d{2}$/.test(form.data || "") ? form.data : today,
  };

  if ([payload.cod_banco, payload.cod_agencia, payload.cod_contabancaria, payload.cod_tipocontabancaria].some(Number.isNaN)) {
    throw new Error("Parâmetros inválidos (banco/agência/conta/tipo).");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const resp = await fetch(`${urlApi}/fluxo-caixa/alterar-saldo`, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  });

  const text = await resp.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { }
  if (!resp.ok) throw new Error(json?.error || `HTTP ${resp.status}: ${text}`);
  return json;
}


/* =========================================
 * DELETE - Remove ajuste de saldo do dia
 * ========================================= */
export async function deletarContaSaldo(
  form: {
    cod_banco: number;
    cod_agencia: number;
    cod_contabancaria: number;
    digito: string | number | null;
    cod_tipo: number | string;
    data: string; // YYYY-MM-DD (obrigatório para remoção)
  },
  token?: string
) {
  const payload = {
    cod_banco: Number(form.cod_banco),
    cod_agencia: Number(form.cod_agencia),
    cod_contabancaria: Number(form.cod_contabancaria),
    cod_tipocontabancaria: Number(form.cod_tipo),
    digito: form.digito == null ? null : String(form.digito),
    data: form.data,
  };

  if (![payload.cod_banco, payload.cod_agencia, payload.cod_contabancaria, payload.cod_tipocontabancaria].every(Number.isFinite)) {
    throw new Error("Parâmetros inválidos (banco/agência/conta/tipo).");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.data || "")) {
    throw new Error("Informe 'data' no formato YYYY-MM-DD.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const resp = await fetch(`${urlApi}/fluxo-caixa/remover-saldo`, {
    method: "DELETE",
    headers,
    body: JSON.stringify(payload),
  });

  const text = await resp.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* não-JSON */ }

  if (!resp.ok) {
    // tenta devolver mensagem útil
    throw new Error(json?.error || json?.message || `HTTP ${resp.status}: ${text}`);
  }
  return json;
}
