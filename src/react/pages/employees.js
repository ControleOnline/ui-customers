import React from 'react';
import People from '@controleonline/ui-people/src/react/pages/People';

const Employees = () => {
  return (
    <People
      context={{
        context: ['employee', 'owner'],
        defaultContext: 'employee',
        title: global.t?.t('people', 'label', 'employee'),
        searchPlaceholder: global.t?.t('people', 'label', 'employee'),
        modalTitleByType: {
          employee: 'Cadastro de Funcionario',
          owner: 'Cadastro de Proprietario',
        },
        typeSelectorLabel: global.t?.t('people', 'label', 'contactRole'),
      }}
    />
  );
};

export default Employees;
