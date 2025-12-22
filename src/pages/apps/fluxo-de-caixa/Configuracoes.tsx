import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import OperacoesBaixaTab from './components/OperacoesBaixaTab';
import TiposContasPagarTab from './components/TiposContasPagarTab';
import FornecedoresTab from './components/FornecedoresTab';
import EmpenhoTab from './components/EmpenhoTab';



export default function Configuracoes() {
  const { token } = useAuth();

  const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
  const [activeTab, setActiveTab] = useState('opBaixa');


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações do Sistema</h1>
        <p className="text-muted-foreground mt-1">
          Configure quais as operações de baixa
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full min-w-[500px] max-w-4xl grid-cols-4 gap-1 p-1 bg-muted rounded-lg">
          <TabsTrigger value="opBaixa" className="text-xs">Operações de Baixa</TabsTrigger>
          <TabsTrigger value="tiposContas">Tipos de Contas</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
          <TabsTrigger value="empenho">Empenho</TabsTrigger>
        </TabsList>

        <TabsContent value="opBaixa" className="space-y-4">
          <OperacoesBaixaTab token={token} urlApi={urlApi} />
        </TabsContent>

        <TabsContent value="tiposContas" className="space-y-4">
          <TiposContasPagarTab token={token} urlApi={urlApi} />
        </TabsContent>

        <TabsContent value="fornecedores" className="space-y-4">
          <FornecedoresTab token={token} urlApi={urlApi} />
        </TabsContent>

        <TabsContent value="empenho" className="space-y-4">
          <EmpenhoTab token={token} urlApi={urlApi} />
        </TabsContent>
      </Tabs>

    </div>
  );
}