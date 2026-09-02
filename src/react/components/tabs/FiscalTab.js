import React from 'react';
import FiscalCompanyConfig from '@controleonline/ui-accounting/src/react/components/fiscal/FiscalCompanyConfig';

export default function FiscalTab({ client, navigation }) {
  return <FiscalCompanyConfig company={client} navigation={navigation} />;
}
