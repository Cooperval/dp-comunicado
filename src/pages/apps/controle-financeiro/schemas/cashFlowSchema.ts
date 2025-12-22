import * as z from "zod";

/**
 * Schema de validação para lançamentos futuros
 */
export const futureEntrySchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z
    .string()
    .min(1, "Valor é obrigatório")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Valor deve ser um número positivo"),
  due_date: z.string().min(1, "Data de vencimento é obrigatória"),
  entry_type: z.enum(["payable", "receivable"], {
    required_error: "Tipo de lançamento é obrigatório",
  }),
  commitment_group_id: z.string().optional(),
  commitment_id: z.string().optional(),
  commitment_type_id: z.string().optional(),
  notes: z.string().optional(),
});

export type FutureEntryForm = z.infer<typeof futureEntrySchema>;
