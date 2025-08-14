import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AddCompanyModal = ({visible, onClose, onSave}) => {
  const [formData, setFormData] = useState({
    name: '',
    alias: '',
    foundationDate: new Date(),
    peopleType: 'J',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.alias.trim()) {
      Alert.alert('Erro', 'Nome e Alias são obrigatórios');
      return;
    }

    setIsLoading(true);
    try {
      const companyData = {
        name: formData.name.trim(),
        alias: formData.alias.trim(),
        foundationDate: formData.foundationDate.toISOString().split('T')[0],
        peopleType: formData.peopleType,
        link_type: 'client',
        'extra-data': {},
      };

      await onSave(companyData);
      handleClose();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao criar empresa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      alias: '',
      foundationDate: new Date(),
      peopleType: 'J',
    });
    onClose();
  };

  const formatDateInput = text => {
    let numbers = text.replace(/\D/g, '');

    if (numbers.length >= 2) {
      numbers = numbers.substring(0, 2) + '/' + numbers.substring(2);
    }
    if (numbers.length >= 5) {
      numbers = numbers.substring(0, 5) + '/' + numbers.substring(5, 9);
    }

    return numbers;
  };

  const handleDateChange = text => {
    const formatted = formatDateInput(text);

    if (formatted.length === 10) {
      const parts = formatted.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Mês é 0-indexed
      const year = parseInt(parts[2], 10);

      if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900) {
        const newDate = new Date(year, month, day);
        if (!isNaN(newDate.getTime())) {
          setFormData({...formData, foundationDate: newDate});
        }
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}>
        <View
          style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '80%',
          }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: '#e9ecef',
            }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#212529',
              }}>
              Nova Empresa
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Icon name="close" size={24} color="#6c757d" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{padding: 20}}>
            {/* Nome */}
            <View style={{marginBottom: 20}}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#212529',
                  marginBottom: 8,
                }}>
                Nome *
              </Text>
              <TextInput
                value={formData.name}
                onChangeText={text => setFormData({...formData, name: text})}
                placeholder="Digite o nome da empresa"
                style={{
                  borderWidth: 1,
                  borderColor: '#e9ecef',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  backgroundColor: '#f8f9fa',
                }}
                placeholderTextColor="#6c757d"
              />
            </View>

            {/* Alias */}
            <View style={{marginBottom: 20}}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#212529',
                  marginBottom: 8,
                }}>
                Alias *
              </Text>
              <TextInput
                value={formData.alias}
                onChangeText={text => setFormData({...formData, alias: text})}
                placeholder="Digite o alias da empresa"
                style={{
                  borderWidth: 1,
                  borderColor: '#e9ecef',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  backgroundColor: '#f8f9fa',
                }}
                placeholderTextColor="#6c757d"
              />
            </View>

            {/* Tipo de Pessoa */}
            <View style={{marginBottom: 20}}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#212529',
                  marginBottom: 8,
                }}>
                Tipo de Pessoa
              </Text>
              <View style={{flexDirection: 'row', gap: 12}}>
                <TouchableOpacity
                  onPress={() => setFormData({...formData, peopleType: 'F'})}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor:
                      formData.peopleType === 'F' ? '#007bff' : '#e9ecef',
                    backgroundColor:
                      formData.peopleType === 'F' ? '#e7f3ff' : '#f8f9fa',
                  }}>
                  <Icon
                    name="person"
                    size={20}
                    color={formData.peopleType === 'F' ? '#007bff' : '#6c757d'}
                  />
                  <Text
                    style={{
                      marginLeft: 8,
                      fontSize: 16,
                      color:
                        formData.peopleType === 'F' ? '#007bff' : '#6c757d',
                      fontWeight: formData.peopleType === 'F' ? '600' : '400',
                    }}>
                    Física
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setFormData({...formData, peopleType: 'J'})}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor:
                      formData.peopleType === 'J' ? '#007bff' : '#e9ecef',
                    backgroundColor:
                      formData.peopleType === 'J' ? '#e7f3ff' : '#f8f9fa',
                  }}>
                  <Icon
                    name="business"
                    size={20}
                    color={formData.peopleType === 'J' ? '#007bff' : '#6c757d'}
                  />
                  <Text
                    style={{
                      marginLeft: 8,
                      fontSize: 16,
                      color:
                        formData.peopleType === 'J' ? '#007bff' : '#6c757d',
                      fontWeight: formData.peopleType === 'J' ? '600' : '400',
                    }}>
                    Jurídica
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Data de Fundação */}
            <View style={{marginBottom: 30}}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#212529',
                  marginBottom: 8,
                }}>
                Data de Fundação
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#e9ecef',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  backgroundColor: '#f8f9fa',
                }}>
                <Icon name="calendar-today" size={20} color="#6c757d" />
                <TextInput
                  placeholder="DD/MM/AAAA"
                  value={formData.foundationDate.toLocaleDateString('pt-BR')}
                  onChangeText={handleDateChange}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    fontSize: 16,
                    color: '#212529',
                  }}
                  placeholderTextColor="#6c757d"
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View
            style={{
              flexDirection: 'row',
              padding: 20,
              gap: 12,
              borderTopWidth: 1,
              borderTopColor: '#e9ecef',
            }}>
            <TouchableOpacity
              onPress={handleClose}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#6c757d',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#6c757d',
                }}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: isLoading ? '#6c757d' : '#007bff',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#fff',
                }}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddCompanyModal;
