import React from 'react';
import People from '@controleonline/ui-people/src/react/pages/People';

const Franchisees = ({route}) => {
  const openCreateModal = Boolean(route?.params?.openCreateModal);

  return (
    <People
      initialShowAddModal={openCreateModal}
      context={{
        context: 'franchisee',
        title: global.t?.t('people', 'title', 'franchisees') || 'Franquias',
        searchPlaceholder:
          global.t?.t('people', 'searchPlaceholder', 'searchFranchise') ||
          'Buscar franquia',
        modalTitle:
          global.t?.t('people', 'title', 'franchiseRegister') || 'Cadastro de Franquia',
        emptyTitle: global.t?.t('people', 'title', 'emptyFranchise') || 'Nenhuma franquia cadastrada',
        emptySearchTitle:
          global.t?.t('people', 'title', 'emptySearchFranchise') ||
          'Nenhuma franquia encontrada',
        emptySubtitle:
          global.t?.t('people', 'title', 'addFirstFranchise') ||
          'Cadastre a primeira franquia para comecar.',
      }}
    />
  );
};

export default Franchisees;
