import {Alert} from 'react-native';
import {extractId} from './employeesTabHelpers';

export const EMPLOYEE_UNLINK_TITLE = 'Remover colaborador';
export const EMPLOYEE_UNLINK_MESSAGE =
  'O colaborador será marcado como removido e o vínculo com a empresa será desativado. O registro permanece no banco (exclusão lógica). Deseja continuar?';

export const extractEmployeeUnlinkIds = employee => ({
  peopleId: extractId(employee?.id || employee?.['@id']),
  linkId:
    extractId(employee?.peopleLinkId) ||
    extractId(employee?.peopleLink?.id || employee?.peopleLink?.['@id']),
});

export const confirmEmployeeRemoval = ({showDialog, onConfirm, onCancel}) => {
  if (typeof showDialog === 'function') {
    showDialog({
      title: EMPLOYEE_UNLINK_TITLE,
      message: EMPLOYEE_UNLINK_MESSAGE,
      confirmLabel: 'Remover',
      cancelLabel: 'Cancelar',
      onConfirm,
      onCancel,
    });
    return;
  }

  Alert.alert(EMPLOYEE_UNLINK_TITLE, EMPLOYEE_UNLINK_MESSAGE, [
    {text: 'Cancelar', style: 'cancel', onPress: onCancel},
    {text: 'Remover', style: 'destructive', onPress: onConfirm},
  ]);
};

export const removeEmployeeFromCompany = async ({
  peopleId,
  linkId,
  removePeople,
  removePeopleLink,
}) => {
  // Company Contatos: unlink people_links first. DELETE /people/{id} 404s when
  // the item provider path is filtered (#694) and would soft-delete the person
  // globally instead of only the company link.
  if (linkId && typeof removePeopleLink === 'function') {
    await removePeopleLink(linkId);
    return {mode: 'link', peopleId, linkId};
  }
  if (peopleId && typeof removePeople === 'function') {
    await removePeople(peopleId);
    return {mode: 'people', peopleId, linkId};
  }
  const error = new Error(
    'Não foi possível remover o colaborador (ação indisponível).',
  );
  error.code = 'UNAVAILABLE';
  throw error;
};

export const filterEmployeesAfterUnlink = (list, {peopleId, linkId}) =>
  (list || []).filter(item => {
    const itemPeopleId = extractId(item?.id || item?.['@id']);
    const itemLinkId = extractId(
      item?.peopleLink?.id || item?.peopleLink?.['@id'] || item?.peopleLinkId,
    );
    if (peopleId && itemPeopleId === peopleId) {
      return false;
    }
    if (linkId && itemLinkId === linkId) {
      return false;
    }
    return true;
  });
