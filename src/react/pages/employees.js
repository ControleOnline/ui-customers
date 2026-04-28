import React from 'react';
import People from '@controleonline/ui-people/src/react/pages/People';

const Employees = () => {
  return (
    <People
      context={{
        context: 'employee',
        title: global.t?.t('people', 'label', 'employee'),
        searchPlaceholder: global.t?.t('people', 'label', 'employee'),
      }}
    />
  );
};

export default Employees;
