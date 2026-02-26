import React from 'react';
import { View, ScrollView } from 'react-native';
import ContactTab from './ContactTab';
import DocumentsTab from './DocumentsTab';
import AddressesTab from './AddressesTab';

const GeneralTab = (props) => {
    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: '#fff' }}
            contentContainerStyle={{ paddingBottom: 80 }}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}>
            <ContactTab {...props} />
            <DocumentsTab {...props} />
            <AddressesTab {...props} />
        </ScrollView>
    );
};

export default GeneralTab;
