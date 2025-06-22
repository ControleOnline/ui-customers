import React, {useState, useCallback} from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import css from '@controleonline/ui-people/src/react/css/people';
import {useFocusEffect} from '@react-navigation/native';
import md5 from 'md5';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Profile = ({route}) => {
  const {client} = route.params || {};
  const {styles} = css();
  const [phones, setPhones] = useState([]);
  const [emails, setEmails] = useState([]);

  const fetchUser = useCallback(() => {
    const rawPhones = Array.isArray(client?.phone)
      ? client.phone.map(p => `(${p.ddd}) ${p.phone}`)
      : [];
    const rawEmails = Array.isArray(client?.email)
      ? client.email.map(e => e.email)
      : [];

    setPhones(rawPhones);
    setEmails(rawEmails);
  }, [client]);

  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, [fetchUser]),
  );

  const getAvatarUrl = () => {
    if (!client?.email?.[0]?.email) return 'https://www.gravatar.com/avatar/?d=identicon';
    const emailHash = md5(client.email[0].email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${emailHash}?s=200&d=identicon`;
  };

  const renderEditableList = (items, setItems, type) => (
    <View style={styles.listContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {type === 'phone' ? 'Phones' : 'Emails'}
        </Text>
        <TouchableOpacity onPress={() => setItems([...items, ''])}>
          <Icon name="add" size={24} color={styles.addIcon.color} />
        </TouchableOpacity>
      </View>
      {items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <TextInput
            style={styles.input}
            value={item}
            onChangeText={text => {
              const newItems = [...items];
              newItems[index] = text;
              setItems(newItems);
            }}
            placeholder={`Enter ${type}`}
          />
          <TouchableOpacity
            onPress={() => {
              const newItems = items.filter((_, i) => i !== index);
              setItems(newItems);
            }}>
            <Text style={styles.deleteButton}>×</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  if (!client) {
    return (
      <SafeAreaView style={styles.Profile}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load client data</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.Profile}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Image source={{uri: getAvatarUrl()}} style={styles.avatar} />
          <Text style={styles.clientName}>{client.name}</Text>
        </View>

        <View style={styles.contentContainer}>
          {renderEditableList(phones, setPhones, 'phone')}
          {renderEditableList(emails, setEmails, 'email')}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
