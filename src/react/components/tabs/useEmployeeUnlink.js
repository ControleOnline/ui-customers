import {useCallback} from 'react';
import {
  confirmEmployeeRemoval,
  extractEmployeeUnlinkIds,
  filterEmployeesAfterUnlink,
  removeEmployeeFromCompany,
} from './employeeUnlink';

export const useEmployeeUnlink = ({
  removePeople,
  removePeopleLink,
  showDialog,
  showError,
  showSuccess,
  setEmployees,
}) => {
  const handleRemoveEmployee = useCallback(
    employee => {
      const ids = extractEmployeeUnlinkIds(employee);
      if (!ids.peopleId && !ids.linkId) {
        showError?.('Não foi possível identificar o colaborador para remover.');
        return;
      }

      confirmEmployeeRemoval({
        showDialog,
        onConfirm: async () => {
          try {
            await removeEmployeeFromCompany({
              ...ids,
              removePeople,
              removePeopleLink,
            });
            showSuccess?.('Colaborador removido com sucesso.');
            setEmployees?.(prev => filterEmployeesAfterUnlink(prev, ids));
          } catch (error) {
            showError?.(
              error?.message ||
                'Não foi possível remover o colaborador. Verifique vínculos e tente novamente.',
            );
          }
        },
      });
    },
    [
      removePeople,
      removePeopleLink,
      showDialog,
      showError,
      showSuccess,
      setEmployees,
    ],
  );

  return {handleRemoveEmployee};
};

export default useEmployeeUnlink;
