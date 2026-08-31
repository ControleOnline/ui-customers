import React from 'react';
import IntegrationConfigPage from '@controleonline/ui-common/src/react/pages/IntegrationConfigPage';

export default function FiscalTab({ client, navigation }) {
  const companyId = String(client?.id || client?.['@id'] || '').replace(/\D/g, '');

  return (
    <IntegrationConfigPage
      navigation={navigation}
      route={{
        params: {
          providerKey: 'receita-federal',
          companyId,
          clientId: companyId,
        },
      }}
      embedded
    />
  );
}
