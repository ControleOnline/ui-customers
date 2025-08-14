import React, {useState} from 'react';
import {Text, View, ScrollView, TouchableOpacity, Image} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import css from '@controleonline/ui-people/src/react/css/people';
import {detailsStyles} from '../styles/details';
import md5 from 'md5';
import Icon from 'react-native-vector-icons/MaterialIcons';

import ContactTab from '../components/tabs/ContactTab';
import DocumentsTab from '../components/tabs/DocumentsTab';
import UsersTab from '../components/tabs/UsersTab';
import AddressesTab from '../components/tabs/AddressesTab';
import ContractsTab from '../components/tabs/ContractsTab';

const Profile = ({route, navigation}) => {
  const {client} = route.params || {};
  const {styles} = css();
  const customStyles = detailsStyles;

  const [activeTab, setActiveTab] = useState('contact');
  const [isEditing, setIsEditing] = useState(false);
  //update
  const getAvatarUrl = () => {
    if (!client?.email?.[0]?.email && !client?.name) {
      return 'https://www.gravatar.com/avatar/?d=identicon';
    }

    let hashSource = '';
    if (client?.email?.[0]?.email) {
      hashSource = client.email[0].email.trim().toLowerCase();
    } else if (client?.name) {
      hashSource = client.name.trim().toLowerCase();
    }

    const hash = md5(hashSource);
    return `https://www.gravatar.com/avatar/${hash}?s=200&d=identicon`;
  };

  const renderTabBar = () => (
    <View style={customStyles.tabBar}>
      {[
        {key: 'contact', label: 'Contato', icon: 'phone'},
        {key: 'documents', label: 'Documentos', icon: 'description'},
        {key: 'users', label: 'Usuários', icon: 'people'},
        {key: 'addresses', label: 'Endereços', icon: 'location-on'},
        {key: 'contracts', label: 'Contratos', icon: 'assignment'},
      ].map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[
            customStyles.tabItem,
            activeTab === tab.key && customStyles.tabItemActive,
          ]}
          onPress={() => setActiveTab(tab.key)}>
          <Icon
            name={tab.icon}
            size={20}
            color={activeTab === tab.key ? '#007bff' : '#666'}
          />
          <Text
            style={[
              customStyles.tabLabel,
              activeTab === tab.key && customStyles.tabLabelActive,
            ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'contact':
        return (
          <ContactTab
            client={client}
            customStyles={customStyles}
            isEditing={isEditing}
          />
        );
      case 'documents':
        return (
          <DocumentsTab
            client={client}
            customStyles={customStyles}
            isEditing={isEditing}
          />
        );
      case 'users':
        return (
          <UsersTab
            client={client}
            customStyles={customStyles}
            isEditing={isEditing}
          />
        );
      case 'addresses':
        return (
          <AddressesTab
            client={client}
            customStyles={customStyles}
            isEditing={isEditing}
          />
        );
      case 'contracts':
        return <ContractsTab client={client} customStyles={customStyles} />;
      default:
        return (
          <ContactTab
            client={client}
            customStyles={customStyles}
            isEditing={isEditing}
          />
        );
    }
  };

  if (!client) {
    return (
      <SafeAreaView style={styles.Profile}>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#ff4444" />
          <Text style={styles.errorText}>
            Falha ao carregar dados do cliente
          </Text>
          <TouchableOpacity
            style={customStyles.retryButton}
            onPress={() => navigation.goBack()}>
            <Text style={customStyles.retryButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.Profile}>
      <View style={customStyles.headerContainer}>
        <Image source={{uri: getAvatarUrl()}} style={customStyles.avatar} />
        <View style={customStyles.clientInfo}>
          <Text style={customStyles.clientName}>
            {String(client.name || '')}
          </Text>
          <Text style={customStyles.clientId}>
            ID: {String(client.id || '')}
          </Text>
        </View>
      </View>

      <View style={customStyles.actionContainer}>
        {!isEditing ? (
          <TouchableOpacity
            style={customStyles.editButton}
            onPress={() => setIsEditing(true)}>
            <Icon name="edit" size={20} color="#fff" />
            <Text style={customStyles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        ) : (
          <View style={customStyles.editActions}>
            <TouchableOpacity
              style={customStyles.cancelButton}
              onPress={() => setIsEditing(false)}>
              <Icon name="close" size={20} color="#666" />
              <Text style={customStyles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {renderTabBar()}

      <ScrollView
        style={customStyles.scrollContainer}
        contentContainerStyle={customStyles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
