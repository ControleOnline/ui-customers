import React from 'react';
import {View} from 'react-native';
import Contracts from '@controleonline/ui-contracts/src/react/components/contracts';

const ContractsTab = ({client, customStyles, parentCompanyIri}) => {
  return (
    <View style={customStyles.tabContent}>
      <Contracts client={client} parentCompanyIri={parentCompanyIri} />
    </View>
  );
};

export default ContractsTab;
