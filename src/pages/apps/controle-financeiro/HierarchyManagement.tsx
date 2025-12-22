import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TreePine } from 'lucide-react';
import { HierarchyTabs } from '@/pages/apps/controle-financeiro/components/hierarchy/HierarchyTabs';
import { AdminRoute } from '@/pages/apps/controle-financeiro/auth/AdminRoute';

const HierarchyManagement: React.FC = () => {
  return (
    <AdminRoute>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TreePine className="w-5 h-5" />
              Gerenciar Hierarquia de Naturezas
            </CardTitle>
            <CardDescription>
              Crie e edite tipos, grupos e naturezas da sua empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HierarchyTabs />
          </CardContent>
        </Card>
      </div>
    </AdminRoute>
  );
};

export default HierarchyManagement;
