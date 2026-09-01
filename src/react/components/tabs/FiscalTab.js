import React from 'react';
import CteFiscalConfig from '@controleonline/ui-accounting/src/react/components/fiscal/CteFiscalConfig';

export default function FiscalTab({ client, navigation }) {
  return <CteFiscalConfig company={client} navigation={navigation} />;
}
