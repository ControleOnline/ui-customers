import React from 'react';
import {View, Text} from 'react-native';
import Contracts from '@controleonline/ui-contracts/src/react/components/contracts';

const ContractsTab = ({client, customStyles}) => {
  return (
    <View style={customStyles.tabContent}>
      <Contracts client={client} />
    </View>
  );
};

export default ContractsTab;
