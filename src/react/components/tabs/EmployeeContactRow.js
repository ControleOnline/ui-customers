import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import PeopleAvatar from '@controleonline/ui-people/src/react/components/PeopleAvatar';
import {
  buildEmployeeDetailNavParams,
  extractId,
  formatEmployeeContactMeta,
  formatEmployeeContactTitle,
} from './employeesTabHelpers';

const EmployeeContactRow = ({
  item,
  parentPeopleId,
  customStyles,
  peopleActions,
  navigation,
  onRemove,
}) => {
  const linkId = extractId(
    item?.peopleLink?.id || item?.peopleLink?.['@id'] || item?.peopleLinkId,
  );

  return (
    <TouchableOpacity
      style={[customStyles.listItem, customStyles.listItemWithEndAction]}
      activeOpacity={0.8}
      onPress={() => {
        const params = buildEmployeeDetailNavParams({
          employee: item,
          parentPeopleId,
        });
        if (!params) {
          return;
        }
        peopleActions?.setItem?.(item);
        navigation.push('ClientDetails', params);
      }}>
      <View style={customStyles.itemContent}>
        <PeopleAvatar
          people={item}
          size={40}
          backgroundColor={customStyles.listAvatarBrand.backgroundColor}
          borderColor={customStyles.listAvatarBrand.borderColor}
          borderWidth={2}
          textColor={customStyles.listAvatarText.color}
          style={customStyles.listAvatar}
        />
        <View>
          <Text style={customStyles.itemText}>
            {formatEmployeeContactTitle(item)}
          </Text>
          <Text style={customStyles.itemSubtext}>
            {formatEmployeeContactMeta(item)}
          </Text>
        </View>
      </View>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
        <View style={customStyles.iconButtonGhost}>
          <FeatherIcon
            name="edit-2"
            size={16}
            color={customStyles.iconButtonGhostIcon.color}
          />
        </View>
        <TouchableOpacity
          style={customStyles.iconButtonGhost}
          onPress={event => {
            event?.stopPropagation?.();
            onRemove?.(item);
          }}
          testID={`employee-unlink-${linkId}`}
          accessibilityRole="button"
          accessibilityLabel="Remover colaborador"
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <FeatherIcon name="trash-2" size={16} color="#B91C1C" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default EmployeeContactRow;
