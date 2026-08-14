import React from 'react';
import IntegrationConfigPage from '@controleonline/ui-common/src/react/pages/IntegrationConfigPage';

/**
 * Atalho na ficha da empresa: mesmo componente da integracao Receita Federal.
 * Nao duplica formulario — reutiliza IntegrationConfigPage (#347 / #371).
 */
export default function FiscalTab({ client, navigation }) {
  return (
    <IntegrationConfigPage
      navigation={navigation}
      route={{
        params: {
          providerKey: 'receita-federal',
          companyId: client?.id,
        },
      }}
      embedded
    />
  );
}
