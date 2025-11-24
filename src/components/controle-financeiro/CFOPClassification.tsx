import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Settings, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { useAuth } from '@/components/auth/controle-financeiro/AuthProvider';

interface CFOPData {
  cfop: string;
  count: number;
  classification?: string;
}

interface CFOPClassificationProps {
  onUpdate?: () => void;
}

export default function CFOPClassification({ onUpdate }: CFOPClassificationProps) {
  const { companyId } = useAuth();
  const [cfops, setCfops] = useState<CFOPData[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);


  const loadCFOPs = async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      
      // Get all distinct CFOPs from NFe documents
      const { data: nfeData, error: nfeError } = await supabase
        .from('nfe_documents')
        .select('cfop')
        .eq('company_id', companyId)
        .not('cfop', 'is', null);

      if (nfeError) throw nfeError;

      // Count CFOPs
      const cfopCounts = (nfeData || []).reduce((acc, item) => {
        if (item.cfop) {
          acc[item.cfop] = (acc[item.cfop] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Get existing classifications
      const { data: classificationData, error: classError } = await supabase
        .from('cfop_classifications')
        .select('cfop, classification')
        .eq('company_id', companyId);

      if (classError) throw classError;

      const classificationMap = (classificationData || []).reduce((acc, item) => {
        acc[item.cfop] = item.classification;
        return acc;
      }, {} as Record<string, string>);

      // Combine data
      const cfopList = Object.entries(cfopCounts).map(([cfop, count]) => ({
        cfop,
        count,
        classification: classificationMap[cfop]
      }));

      setCfops(cfopList.sort((a, b) => a.cfop.localeCompare(b.cfop)));
    } catch (error) {
      console.error('Error loading CFOPs:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os CFOPs.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateClassification = async (cfop: string, classification: string) => {
    if (!companyId) return;
    
    try {
      setUpdating(cfop);
      
      const { error } = await supabase
        .from('cfop_classifications')
        .upsert({
          cfop,
          classification,
          company_id: companyId
        }, {
          onConflict: 'company_id,cfop'
        });

      if (error) throw error;

      // Update local state
      setCfops(prev => prev.map(item => 
        item.cfop === cfop 
          ? { ...item, classification }
          : item
      ));

      toast({
        title: "Sucesso",
        description: `CFOP ${cfop} classificado como ${classification === 'custo' ? 'Preço de Custo' : 'Preço de Venda'}.`,
        variant: "default"
      });

      onUpdate?.();
    } catch (error) {
      console.error('Error updating classification:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a classificação do CFOP.",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const getClassificationBadge = (classification?: string) => {
    if (!classification) return <Badge variant="outline">Não classificado</Badge>;
    
    return (
      <Badge 
        variant={classification === 'custo' ? 'destructive' : 'default'}
        className="gap-1"
      >
        {classification === 'custo' ? (
          <TrendingDown className="w-3 h-3" />
        ) : (
          <TrendingUp className="w-3 h-3" />
        )}
        {classification === 'custo' ? 'Preço de Custo' : 'Preço de Venda'}
      </Badge>
    );
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Classificação de CFOPs
            </CardTitle>
            <CardDescription>
              Classifique os códigos CFOP como preço de custo ou preço de venda para análise de margem
            </CardDescription>
          </div>
          <Button onClick={loadCFOPs} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Settings className="mr-2 h-4 w-4" />
                Buscar CFOPs
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando CFOPs...</p>
          </div>
        ) : cfops.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhum CFOP encontrado.
            </p>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Clique em 'Buscar CFOPs' para carregar as classificações das NFes importadas.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {cfops.map((cfopData) => (
              <div 
                key={cfopData.cfop} 
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">CFOP {cfopData.cfop}</p>
                    <p className="text-sm text-muted-foreground">
                      {cfopData.count} NFe{cfopData.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {getClassificationBadge(cfopData.classification)}
                </div>
                
                <div className="flex items-center gap-2">
                  <Select
                    value={cfopData.classification || undefined}
                    onValueChange={(value) => updateClassification(cfopData.cfop, value)}
                    disabled={updating === cfopData.cfop}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Classificar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custo">Preço de Custo</SelectItem>
                      <SelectItem value="venda">Preço de Venda</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {updating === cfopData.cfop && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}